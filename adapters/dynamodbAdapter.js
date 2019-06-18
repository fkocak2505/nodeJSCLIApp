const Excel = require('exceljs');
const moment = require('moment');
const enumJs = require('../commons/enum');
const uuidv1 = require('uuid/v1');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

var docClient = new AWS.DynamoDB.DocumentClient();
var arrOfItemDynamoDB = [];

//================================================================
const getInvoice = (options) => {
    if (options.accountName != undefined) {
        console.log("getInvoice");
        var params = {
            TableName: 'FK_INVOICE',
            FilterExpression: "accountName = :val",
            ExpressionAttributeValues: { ":val": options.accountName },

        };

        docClient.scan(params, function(err, data) {
            if (!err) {
                options.callback(data);
            } else {
                console.log("faturalar listelenirken hata olustu");
            }
        });
    } else {
        console.log("Account ID gelmedi");
    }
}

//================================================================
const fetchInvoiceFromDynamoDB = (content, persistFileName) => {
    scanAllInvoice({
        callback: (data) => {
            data.forEach(function(invoiceItem) {
                arrOfItemDynamoDB.push([invoiceItem.accountName,
                    invoiceItem.edocType,
                    invoiceItem.currency,
                    invoiceItem.ettn,
                    invoiceItem.firmName,
                    invoiceItem.id,
                    invoiceItem.logoURL,
                    invoiceItem.opDate,
                    invoiceItem.payableAmount,
                    invoiceItem.paymentDueDate,
                    invoiceItem.pdfURL,
                    invoiceItem.product
                ]);
            });
            persistInvoice2XLSX(persistFileName);
        }

    });
}

//================================================================
const scanAllInvoice = (options) => {
    console.log("Started scan invoice");
    var allInvoiceList = [];
    var arr = [];

    var params = {
        TableName: 'FK_INVOICE'
    }

    docClient.scan(params, function scanAllInvoiceUntilDone(err, data) {
        if (err) {
            console.log("Faturalar listenirken hata oluştu (scanAllInvoice)");
        } else {
            if (data.LastEvaluatedKey) {
                arr.push(data.LastEvaluatedKey);
                allInvoiceList.push(data.Items);
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, scanAllInvoiceUntilDone);
            } else {
                allInvoiceList.push(data.Items);
                allInvoiceList = concatOfAllItems(allInvoiceList);
                options.callback(allInvoiceList);
            }
        }

    });
}

//================================================================
function concatOfAllItems(arr) {
    var cancattedArr = [];
    for (var i = 0; i < arr.length; i++) {
        cancattedArr = cancattedArr.concat(arr[i]);
    }
    return cancattedArr;
}

//================================================================
function persistInvoice2XLSX(persistFileName) {
    var wb = new Excel.Workbook();

    //dynamodb Info
    var worksheet = wb.addWorksheet("dynamodb");
    worksheet.addRow(["name", "Golgi Fetch Invoice From Dynamodb"]).commit();
    worksheet.addRow(["desc", "It fetch allinvoice"]).commit();
    worksheet.addRow(["lastFetchTime", moment().format('MMMM Do YYYY, h:mm:ss a')]).commit();

    //allinvoice
    var worksheet = wb.addWorksheet("invoiceList");
    worksheet.addRow(["AccountName", "EdocType", "Currency", "ETTN", "FirmName", "Id", "LogoURL", "OpDate", "PayableAmount", "PaymentDueDate", "PdfURL", "Product"]).commit();
    arrOfItemDynamoDB.forEach(function(invoiceItem) {
        worksheet.addRow(invoiceItem).commit();
    });
    wb.xlsx.writeFile(__dirname + "/../data/" + persistFileName).then(function() { console.log("invoice fetching finished from dynamodb"); });
}

//================================================================
const createTable = (tableName) => {
    if (tableName === "ALL_TABLE") {
        for (var nameOfTable in TablePrimaryKey) {
            var params = {
                TableName: nameOfTable,
                KeySchema: [{ AttributeName: TablePrimaryKey[nameOfTable], KeyType: "HASH" }],
                AttributeDefinitions: [{ AttributeName: TablePrimaryKey[nameOfTable], AttributeType: "S" }],
                ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
            };
            dynamodb.createTable(params, function(err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Created table");
                }
            });
        }
    } else {
        var params = {
            TableName: tableName,
            KeySchema: [
                { AttributeName: TablePrimaryKey[tableName], KeyType: "HASH" } // PK
            ],
            AttributeDefinitions: [
                { AttributeName: TablePrimaryKey[tableName], AttributeType: "S" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        };
        dynamodb.createTable(params, function(err, data) {
            if (err) {
                console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Created table => " + tableName);
            }
        });
    }
}

//================================================================
const deleteTable = (tableName) => {
    if (tableName === "ALL_TABLE") {
        for (var nameOfTable in TablePrimaryKey) {
            var params = { TableName: nameOfTable };
            dynamodb.deleteTable(params, function(err, data) {
                if (err) console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
                else console.log("Deleted table: => " + params.TableName);

            });
        }
    } else {
        var params = { TableName: tableName };
        dynamodb.deleteTable(params, function(err, data) {
            if (err) console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
            else console.log("Deleted table: => " + tableName);
        });
    }
}

//================================================================
const putItem = (tableName) => {
    var params = {};

    if (tableName === "GOLGI_USER") {
        GolgiUserTableData.forEach((userItem) => {
            userItem.userID = uuidv1();
            userItem.kayitTarihi = moment().format('YYYY/MM/DD-HH:mm:ss');
            params = {
                TableName: "GOLGI_USER",
                Item: userItem
            }

            console.log("Adding item ==> " + userItem.eposta);
            docClient.put(params, function(err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item");
                }
            });
        })


    } else if (tableName === "GOLGI_ACCOUNT") {
        GolgiAccountTableData.forEach((accountItem) => {
            accountItem.accountID = uuidv1();
            accountItem.favorites = JSON.stringify(ViewMenuObj);
            accountItem.checkOpDate = moment().format('YYYY/MM/DD-HH:mm:ss');
            params = {
                TableName: "GOLGI_ACCOUNT",
                Item: accountItem
            }

            console.log("Adding item ==> " + accountItem.email);
            docClient.put(params, function(err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item");
                }
            });
        })
    } else console.log("Geçerli Bir tablo Adı girmediniz..!");
}




module.exports = {
    scanAllInvoice,
    fetchInvoiceFromDynamoDB,
    createTable,
    deleteTable,
    putItem
};