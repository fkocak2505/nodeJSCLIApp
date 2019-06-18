//================================================
const Excel = require('exceljs');
const fs = require("fs");
const chalk = require('chalk');
const Table = require('cli-table');
const simpleParser = require('mailparser').simpleParser;
const async = require('async');
const emailParse = require('../parsers/emailparse');
const emailDisplayParse = require('../parsers/emailDisplayParse');
const enumJs = require('../commons/enum');
var rmdir = require('rmdir');
var pdfUtil = require('pdf-to-text');
const pdf2text = require('../converters/pdftotext2');
const htmlToText = require('html-to-text');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();



//=========INFO =======================================================
const getInfo = () => {
    console.log("$ golgi info s3")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("s3info");
            worksheet.eachRow(function(row, rowNo) {
                var key = row.getCell(1).value;
                var val = row.getCell(2).value;
                console.log(chalk.red(key + ": ") + val);
            });
        });
}


//================================================================
const getMailboxInfo = () => {
    console.log("$ golgi info mailbox")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var itemCounter = 0;
            var accountIDs = new Set();
            var emailIDs = new Set();
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                let arr = Key.split("/")
                if (arr.length > 0) { accountIDs.add(arr[0]); }
                if (arr.length > 1) { emailIDs.add(arr[1]) };
                itemCounter++;
            });
            console.log(chalk.red("Item Count: ") + itemCounter);
            console.log(chalk.red("Email Count: ") + emailIDs.size);
            console.log(chalk.red("Account Count: ") + accountIDs.size);
        });
}


//================================================================
const getItemInfo = (key) => {
    console.log("$ golgi info item " + key)
    try {
        const stats = fs.statSync(key.getObjFilePath())
        console.log(stats);
    } catch (e) {
        console.log("Not Exist Item First Fetch It");
    }
}


//=========SHOW  =======================================================
const showItemContent = (id) => {
    console.log("$ golgi show" + id);
    fs.readFile(id.getObjFilePath(), 'utf-8', function(err, content) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(content);
    });

}


//=========PARSE =======================================================
const parseEmailItemContent = (id, options) => {
    console.log("$ golgi parse email" + id);
    fs.readFile(id.getObjFilePath(), 'utf-8', function(err, content) {
        if (err) {
            console.log(err);
            return;
        }
        simpleParser(content).then(mail => {
            console.log(mail[options.mode]);
        }).catch(err => {})
    });

}



//=========FILTER =======================================================
const filterMailbox = (options) => {
    if (options.not_contains != undefined) console.log("$ golgi filter -n " + options.not_contains);
    else if (options.contains != undefined) console.log("$ golgi filter -c " + options.contains);
    else {
        console.log("Something wrong please lookat golgi filter -h");
        return;
    }


    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            let worksheet = workbook.getWorksheet("mailbox");
            let emailMap = {};
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                let arr = Key.split("/")
                if (arr.length > 1) {
                    let emailID = arr[1];
                    let emailObj = emailMap[emailID];
                    if (emailObj == undefined) {
                        emailObj = { emailID: emailID };
                        emailMap[emailID] = emailObj;
                    }
                    emailObj[arr[2]] = true;
                    emailObj[arr[2] + "_key"] = Key;

                }
            });


            var arr = [];
            for (let key in emailMap) {
                let emailObj = emailMap[key];
                if (options.not_contains != undefined && emailObj[options.not_contains] == undefined) arr.push(emailObj);
                if (options.contains != undefined && emailObj[options.contains] != undefined) {
                    arr.push(emailObj);
                }
            }

            for (var i = 0; i < arr.length; i++) {
                //console.log(i + " :" + arr[i].emailID);
            }

            if (options.callback != undefined) options.callback(arr);
        });
}


//================================================================
const fetchUnstructured = (s3) => {
    filterMailbox({
        contains: ".unstructured",
        callback: (arr) => {
            arr.forEach((arrItem) => {
                if (arrItem[".unstructured_key"] !== undefined) {
                    s3.fetchMailItem(arrItem[".unstructured_key"]);
                }
            });
            /*var a = arr[0];
            s3.fetchMailItem(a[".unstructured_key"]);*/
        }
    });
}


//================================================================
var mimeArr = [];
const generateDisplayFile = (s3) => {

    deleteDisplayFolderAndItem();

    filterMailbox({
        contains: ".unstructured",
        callback: (arr) => {
            var arrOfWithoutDisplay = [];
            arr.forEach((arrItem) => {
                if (arrItem[".display"] === undefined) {
                    arrOfWithoutDisplay.push(arrItem);
                }
            });

            async.mapLimit(arrOfWithoutDisplay, 20, readMimeNode, function(err, results) {
                //console.log("Loading Ended");
                //console.log(err);
                console.log(mimeArr.length);
                async.mapLimit(mimeArr, 20, writeMimeNode, function(err, results) {
                    console.log("Display Dosyaları Oluşturuldu..");
                    console.log(results.length);
                    console.log(err);
                });
            });
        }
    });
}

//================================================================
function deleteDisplayFolderAndItem() {
    rmdir(__dirname + '/../data/displays', function(err, dirs, files) {
        console.log('Display Dosyları silindi..!');
    });
}

//================================================================
function readMimeNode(item, doneCallback) {
    emailDisplayParse.parseEmailItemContent(item[".unstructured_key"].replaceAll("/", "__"), mimeArr, doneCallback);
}

//================================================================
function writeMimeNode(item, doneCallback) {
    emailDisplayParse.renderMimeNode(item, item.fileName, doneCallback);
}

//================================================================
const generateModelData = (s3) => {


    async.waterfall(
        [
            function(callback) {
                filterMailbox({
                    contains: ".unstructured",
                    callback: (arr) => {
                        callback(null, arr);
                    }
                });
            },
            function(arr, callback) {

                var map = {};

                //var arr = arr.slice(0, 10);

                arr.forEach((arrItem) => {
                    emailParse.parseEmailItemContent(arrItem[".unstructured_key"].replaceAll("/", "__"), map);
                });

                var timer = setInterval(function() {
                    console.log("timer start");
                    var flag = true;
                    for (key in map) {
                        var arrOfMimes = map[key];

                        for (var i = 0; i < arrOfMimes.length; i++) {
                            var arrOfMimesItem = arrOfMimes[i];
                            //console.log(arrOfMimesItem.content);
                            if (arrOfMimesItem.content == -1) {
                                flag = false;
                                break;
                            }
                        }
                    }

                    if (flag) {
                        console.log("timer stop");
                        clearTimeout(timer);
                        callback(null, arr, map);
                    }
                }, 3000);
            },
            function(arr, mapOfMimeContent, callback) {
                console.log(".unstructured data not exist count:" + arr.length);
                var workbook = new Excel.Workbook();
                var arrUploadInvoice = [];
                workbook.xlsx.readFile(__dirname + "/../data/invoice.xlsx")
                    .then(function() {
                        let worksheet = workbook.getWorksheet("invoiceList");
                        worksheet.eachRow(function(row, rowNo) {
                            if (rowNo != 1) {
                                let accountName = row.getCell(1).value;
                                let edocType = row.getCell(2).value;
                                let pdfURL = row.getCell(11).value;
                                arrUploadInvoice.push({ "accountName": accountName, "edocType": edocType, "pdfURL": pdfURL });
                            }
                        });
                        callback(null, arrUploadInvoice, arr, mapOfMimeContent);
                    });
            },
            function(arrUploadInvoice, arr, mapOfMimeContent, callback) {
                arrUploadInvoice.forEach((invoiceItem) => {
                    var pdfURL = invoiceItem.pdfURL;
                    var accountName = invoiceItem.accountName;
                    var edocType = invoiceItem.edocType;
                    arr.forEach((arrItem) => {
                        var unstructuredKey = arrItem[".unstructured_key"];
                        if (unstructuredKey !== undefined) {
                            var emailIDOfArr = unstructuredKey.split("/")[1];
                            if (pdfURL.includes(emailIDOfArr)) {
                                var mimeArr = mapOfMimeContent[unstructuredKey];
                                if (mimeArr !== undefined) {
                                    /*mimeArr.forEach((mimeItem) => {
                                        createJSONFile4Unstructured(accountName, edocType, unstructuredKey, emailIDOfArr, mimeItem);
                                    });*/

                                    for (var key in DocTypeEnum) {
                                        if (edocType === key) edocType = DocTypeEnum[edocType];
                                    }

                                    var mimes = [];
                                    for (var i = 0; i < mimeArr.length; i++)
                                        //mimes[i] = { mime: "mime" + i, type: edocType, content: mimeArr[i], contentSize: mimeArr[i].length }
                                    mimes[i] = { mime: "mime" + i, type: mimeArr[i].formatType, content: mimeArr[i].content, contentSize: mimeArr[i].contentSize }

                                    createJSONFile4Unstructured(accountName, edocType, unstructuredKey, emailIDOfArr, mimes);

                                } else {
                                    console.log(unstructuredKey + " mimeOfArr de yoktur");
                                }
                            }
                        } else {
                            console.log(arrItem["emailID"] + " unstructured datası yok.");
                        }
                    });

                });
                callback(null, "");
            }
        ],
        function(err) {
            console.log(err);
        }
    );
}

//================================================================
function createJSONFile4Unstructured(accountName, edocType, unstructuredKey, emailID, mimes) {
    unstructuredKey = unstructuredKey.replaceAll("/", "__");
    var keySplitArr = unstructuredKey.split("/.");
    unstructuredKey = keySplitArr[0] + "/.glgsampling";

    for (var key in DocTypeEnum) {
        if (edocType === key) edocType = DocTypeEnum[edocType];
    }

    var jsonObj = {};
    jsonObj.version = "v00001";
    jsonObj.accountName = accountName;
    jsonObj.emailID = emailID;
    jsonObj.key = unstructuredKey;
    jsonObj.edoc_type = edocType;
    jsonObj.size = 0;
    jsonObj.docindex = 0;
    jsonObj.mimes = mimes;
    var samplingJSON = JSON.stringify(jsonObj);

    fs.writeFile(unstructuredKey.getObjFilePath4UnstructuredJSON(), samplingJSON, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

//================================================================
const scanAllInvoice = (context, options) => {
    var workbook = new Excel.Workbook();
    var arrUploadInvoice = [];
    workbook.xlsx.readFile(__dirname + "/../data/invoice.xlsx")
        .then(function() {
            let worksheet = workbook.getWorksheet("invoiceList");
            worksheet.eachRow(function(row, rowNo) {
                if (rowNo != 1) {
                    let accountName = row.getCell(1).value;
                    let edocType = row.getCell(2).value;
                    let pdfURL = row.getCell(11).value;
                    arrUploadInvoice.push([accountName, edocType, pdfURL]);
                    //options.callback(arrUploadInvoice);
                    options.callback(accountName, edocType, pdfURL);
                }
            });
        });
}


//=========DEBUG =======================================================
const debugUnstructuredFlow = () => {


    async.waterfall([
        function(callback) {
            filterMailbox({
                not_contains: ".unstructured",
                callback: (arr) => {
                    //console.log(".unstructured data not exist count:" + arr.length)
                    callback(null, arr);
                }
            });
        },
        function(arrOfNotExistUnstructured, callback) {


            var workbook = new Excel.Workbook();
            workbook.xlsx.readFile(__dirname + "/../data/uploads.xlsx")
                .then(function() {
                    let worksheet = workbook.getWorksheet("mailbox");
                    let arrUploadKeys = [];
                    worksheet.eachRow(function(row, rowNo) {
                        let Key = row.getCell(1).value;
                        arrUploadKeys.push(Key);
                    });


                    let uploadCounter = 0;
                    let filteredWithUploads = arrOfNotExistUnstructured.filter((elem, index) => {
                        let flag = arrUploadKeys.toString().includes(elem.emailID)
                        if (flag) uploadCounter++;
                        return !flag;
                    })
                    console.log("Uploads contains count:" + uploadCounter)
                    callback(null, filteredWithUploads);

                });

        },
        function(arrOfNotExistUnstructured, callback) {
            var workbook = new Excel.Workbook();
            workbook.xlsx.readFile(__dirname + "/../data/mail.xlsx")
                .then(function() {
                    let worksheet = workbook.getWorksheet("mailbox");
                    let arrMailKeys = [];
                    worksheet.eachRow(function(row, rowNo) {
                        let Key = row.getCell(1).value;
                        arrMailKeys.push(Key);
                    });


                    let mailCounter = 0;
                    let filteredWithMail = arrOfNotExistUnstructured.filter((elem, index) => {
                        let flag = arrMailKeys.toString().includes(elem.emailID)
                        if (flag) mailCounter++;
                        return !flag;
                    })
                    console.log("Mail contains count:" + mailCounter)
                    callback(null, filteredWithMail);

                });

        },
        function(arrOfNotExistUnstructured, callback) {
            var workbook = new Excel.Workbook();
            workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
                .then(function() {
                    let worksheet = workbook.getWorksheet("mailbox");
                    let xmlArr = [];
                    let faturaOzetArr = [];
                    worksheet.eachRow(function(row, rowNo) {
                        let Key = row.getCell(1).value;
                        if (Key.includes(".faturaozet") || Key.includes(".xml")) {
                            arrOfNotExistUnstructured.forEach(elem => {
                                if (Key.includes(elem.emailID) && Key.includes(".faturaozet")) faturaOzetArr.push(elem);
                                else if (Key.includes(elem.emailID) && Key.includes(".xml")) xmlArr.push(elem)
                            });
                        }
                    });

                    callback(null, arrOfNotExistUnstructured, xmlArr, faturaOzetArr);

                });

        },
        function(filteredWithMail, xmlArr, faturaOzetArr, callback) {
            filteredWithMail.forEach((elem, index) => {
                console.log(index + ":" + elem.emailID + " not found");
            });
            xmlArr.forEach((elem, index) => {
                console.log(index + ":" + elem.emailID + " contains xml");
            });
            faturaOzetArr.forEach((elem, index) => {
                console.log(index + ":" + elem.emailID + " contains faturaozet");
            });
            callback(null, 'done');
        }
    ], function(err, result) {
        // result now equals 'done'
    });
}




//=========DEBUG =======================================================
const debugMailbox = () => {



}






//=========LIST =======================================================
const listAccounts = () => {
    console.log("$ golgi list account")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var accountIDs = new Set();
            worksheet.eachRow(function(row, rowNo) {
                if (rowNo != 1) {
                    let Key = row.getCell(1).value;
                    let arr = Key.split("/")
                    if (arr.length > 0) { accountIDs.add(arr[0]); }
                }
            });

            var counter = 0;
            for (let item of accountIDs) {
                counter++;
                console.log(counter + ": " + item);
            }
        });
}


//================================================================
///// EmailID içerisinde hangi türde type' lar olduğunu true false olarak gösteren fonksiyon... 
const listEmailsWithType = (id) => {
    console.log("$ golgi list emails")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var emailIDs = new Map();
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                let arr = Key.split("/");
                var emailID = arr[1];
                var type = arr[2];
                if (arr.length > 1 && arr[0] == id && emailID !== "testmails") {
                    var selectedEmailID = emailIDs.get(emailID);
                    if (selectedEmailID == undefined) {
                        emailIDs.set(emailID, { typeArr: new Set() });
                        selectedEmailID = emailIDs.get(emailID);
                    }
                    selectedEmailID.typeArr.add(type);
                }
            });

            const table = new Table({
                head: ["No", 'EmailID', 'isUnstructured', 'isInfo', 'isUnifed', 'isXML', 'isFaturaOzet', 'isDisplay', 'isML', 'isJSON'],
                colWidths: [5, 60, 20, 10, 10, 10, 20, 20, 10, 10]
            });

            var counter = 0;
            emailIDs.forEach(function(value, key) {
                counter++;
                table.push([counter, key, value.typeArr.has(".unstructured"),
                    value.typeArr.has(".info"),
                    value.typeArr.has(".unified"),
                    value.typeArr.has(".xml"),
                    value.typeArr.has(".faturaozet"),
                    value.typeArr.has(".display"),
                    value.typeArr.has(".ml"),
                    value.typeArr.has(".json")
                ]);
            });

            console.log(table.toString());
        });
}


//================================================================
const listEmails = (id) => {
    console.log("$ golgi list emails")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var emailIDs = new Set();
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                let arr = Key.split("/")
                if (arr.length > 1 && arr[0] == id) { emailIDs.add(arr[1]) };
            });
            var counter = 0;
            for (let item of emailIDs) {
                counter++;
                console.log(counter + ": " + item);
            }
        });
}


//================================================================
const listEmail = (id) => {
    console.log("$ golgi list email")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var emailItems = new Set();
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                let arr = Key.split("/")
                if (arr.length > 2 && arr[1] == id) { emailItems.add(Key) };
            });

            var counter = 0;
            for (let item of emailItems) {
                counter++;
                console.log(counter + ": " + item);
            }


        });
}


//=========LIST DETAILS =======================================================
const listAccountsWithEmailCount = () => {
    console.log("$ golgi list account -d count")
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            var accountIDm = new Map();
            worksheet.eachRow(function(row, rowNo) {
                if (rowNo != 1) {
                    let Key = row.getCell(1).value;
                    let arr = Key.split("/")
                    if (arr.length > 1) {
                        let accountID = arr[0];
                        let emailID = arr[1];
                        var selectedAccount = accountIDm.get(accountID);
                        if (selectedAccount == undefined) {
                            accountIDm.set(accountID, { emailIDs: new Set() })
                            selectedAccount = accountIDm.get(accountID);
                        }
                        selectedAccount.emailIDs.add(emailID);
                    } //end if
                } //end if rowNo
            });

            const table = new Table({
                head: ["No", 'AccountID', 'Email Count'],
                colWidths: [5, 60, 15]
            });

            var counter = 0;
            accountIDm.forEach(function(value, key) {
                counter++;
                table.push([counter, key, value.emailIDs.size]);
            });

            console.log(table.toString());
        });
}


//================================================================
const puts3DisplayFile = () => {
    if (checkDisplayFileIsEmpty()) {
        var bucketName = 'finanskutusu.mailbox';

        fs.readdirSync(__dirname + '/../data/displays').forEach(file => {
            fs.readFile(__dirname + '/../data/displays/' + file, function(err, data) {
                if (err) { throw err; }
                var fileSplitArr = file.split("__");
                //var myKey = '88e03ba0-72f9-11e8-b1f3-a5a623882e6e@finanskutusu.com/6ui48ciivka17h3r7g947llu4j2pq0eldka89eg1/.display';
                var displayName = fileSplitArr[0] + "/" + fileSplitArr[1] + "/.display";
                var params = { Bucket: bucketName, Key: displayName, Body: data, ContentType: 'text/html' };
                s3.putObject(params, function(err, data) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Successfully uploaded data to " + bucketName + "/" + displayName);
                    }
                });
            });
        });
    } else {
        console.log("displays dosyası boştur..!");
    }
}

//================================================================
function checkDisplayFileIsEmpty() {
    var fs = require('fs');
    var files = fs.readdirSync(__dirname + '/../data/displays');
    if (files.length === 0) {
        return false;
    } else {
        return true;
    }
}

//================================================================
const generateEboxMailType = () => {
    fs.readdirSync(__dirname + '/../data/eboxmail').forEach(file => {
        fs.readFile(__dirname + '/../data/eboxmail/' + file, function(err, data) {
            if (err) { return console.log(file + " error"); }
            if (data.includes("PDF-1.4")) {
                fs.writeFile(file.getObjFilePath4eBoxMail() + ".pdf", data, function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("PDF file saved Successfully");
                });
            } else if (!data.includes("PNG")) {
                if (data.includes("div") || data.includes("html")) {
                    fs.writeFile(file.getObjFilePath4eBoxMail() + ".html", data, function(err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("Html file saved Successfully");
                    });
                }
            } else {
                //console.log(file);
            }
        });
    });
}

//================================================================
const generateEboxSamplings = () => {
    var result = addPdfAndHtmlData2Arr();
    console.log(result.htmlFileArr.length)

    async.mapLimit(result.pdfFileArr, 20, convertPDF2Txt, function(err, results) {
        console.log("PDF Golgi sampling created Successfully..");
    });

    async.mapLimit(result.htmlFileArr, 20, convertedHtml2Text, function(err, results) {
        results.forEach((htmlFileObj) => {
            createHTMLFile(htmlFileObj);
        });
    });
}

//================================================================
const addPdfAndHtmlData2Arr = () => {
    var pdfFileArr = [];
    var htmlFileArr = [];

    fs.readdirSync(__dirname + '/../data/eboxmailWithExt').forEach(file => {
        if (file.includes("pdf")) {
            pdfFileArr.push(file);
        } else if (file.includes("html")) {
            //htmlFileArr.push(file);
            htmlFileArr.push({ fileName: file, saveFilePath: __dirname + "/../data/eboxglgsampling/" + file })
        }
    });
    return { pdfFileArr: pdfFileArr, htmlFileArr: htmlFileArr }

}

//================================================================
function convertPDF2Txt(pdfFileName, doneCallback) {
    pdf2text.pdfExtractFile(__dirname + "/../data/eboxmailWithExt/" + pdfFileName, (content) => {
        checkFileIsCreate();
        var pages = []

        content.data.forEach((page) => {
            pages.push(page);
        });


        var glgSamplingEboxFilePath = __dirname + "/../data/eboxglgsampling/" + pdfFileName.replace(".pdf", ".glgsampling");
        fs.readFile(glgSamplingEboxFilePath, function read(err, data) {
            if (err) {
                createPDFFile({
                    saveFilePath: glgSamplingEboxFilePath,
                    emailID: pdfFileName.replace(".pdf", ""),
                    callback: (samplingObj) => {
                        checkMimeArr(samplingObj, pages, glgSamplingEboxFilePath, doneCallback);
                    }
                });
            }
        });
    });
}

//================================================================
const convertedHtml2Text = (htmlFileObj, doneCallback) => {
    console.log(htmlFileObj.fileName);
    htmlToText.fromFile(__dirname + '/../data/eboxmailWithExt/' + htmlFileObj.fileName, {}, (err, text) => {
        if (err) return doneCallback(err);
        else {
            console.log(htmlFileObj.fileName);
            htmlFileObj.content = text;
            return doneCallback(null, htmlFileObj);
        }

    });
}

//================================================================
const createHTMLFile = (htmlFileObjWithContent) => {
    checkFileIsCreate();

    var jsonObj = {};
    jsonObj.version = "v00001";
    jsonObj.emailID = htmlFileObjWithContent.fileName.replace(".html", "");
    jsonObj.edoc_type = "NONE";
    jsonObj.size = 0;
    jsonObj.docindex = 0;
    jsonObj.mimes = [{ mime: "mime0", type: "html", content: htmlFileObjWithContent.content, contentSize: htmlFileObjWithContent.content.length }];

    var samplingJSON = JSON.stringify(jsonObj);
    fs.writeFile(htmlFileObjWithContent.saveFilePath, samplingJSON, function(err) {
        if (err) {
            return console.log(htmlFileObjWithContent.fileName + " error...")
        }
    });
}

//================================================================
function checkMimeArr(samplingObj, pages, glgSamplingEboxFilePath, doneCallback) {
    samplingObj.mimes[0] = { mime: "mime0", type: "pdf", content: pages.toString(), contentSize: pages.toString().length }
    writeFile(JSON.stringify(samplingObj), glgSamplingEboxFilePath, doneCallback);
}

//================================================================
function writeFile(samplingStr, glgSamplingEboxFilePath, doneCallback) {
    fs.writeFile(glgSamplingEboxFilePath, samplingStr, function(err) {
        if (err) {
            return doneCallback(err);
        }
        console.log("Kaydedildi..");
        return doneCallback(null)
    });
}

//================================================================
function checkFileIsCreate() {
    var dir = __dirname + '/../data/eboxglgsampling/';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

//================================================================
const createPDFFile = (options) => {
    var jsonObj = {};
    jsonObj.version = "v00001";
    jsonObj.emailID = options.emailID;
    jsonObj.edoc_type = "NONE";
    jsonObj.size = 0;
    jsonObj.docindex = 0;
    jsonObj.mimes = [];

    var samplingJSON = JSON.stringify(jsonObj);
    fs.writeFile(options.saveFilePath, samplingJSON, function(err) {
        if (err) {
            return console.log(err);
        }

        options.callback(JSON.parse(samplingJSON));
    });
}



//================================================================
const readEboxMailXLSXFile = (options) => {

    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile("data/eboxtestmailbox.xlsx")
        .then(function() {
            let worksheet = workbook.getWorksheet("mailbox");
            var emailArr = [];
            worksheet.eachRow(function(row, rowNo) {
                let Key = row.getCell(1).value;
                if (Key !== "Key") {
                    emailArr.push(Key);
                }
            });

            if (options.callback != undefined) options.callback(emailArr);
        });

}

//================================================================
function loadFileS3ToLocal(s3) {
    readEboxMailXLSXFile({
        callback: (arr) => {
            arr.forEach((arrItem) => {
                if (arrItem !== undefined) {
                    s3.fetchEboxMailItem(arrItem, arrItem.getObjFilePathEbox());
                }
            });
        }
    });
}



// Export all methods
module.exports = {
    getInfo,
    getMailboxInfo,
    getItemInfo,
    listAccounts,
    listEmails,
    listEmail,
    listAccountsWithEmailCount,
    showItemContent,
    filterMailbox,
    parseEmailItemContent,
    debugUnstructuredFlow,
    listEmailsWithType,
    generateModelData,
    scanAllInvoice,
    fetchUnstructured,
    generateDisplayFile,
    puts3DisplayFile,
    generateEboxMailType,
    generateEboxSamplings,
    loadFileS3ToLocal
};