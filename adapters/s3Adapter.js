const AWS = require('aws-sdk');
const moment = require('moment');
const Excel = require('exceljs');
const fs = require("fs");

AWS.config.update({ region: 'eu-west-1' });
AWS.config.apiVersions = { s3: '2006-03-01' };
const s3 = new AWS.S3();


//===============LIST S3 CONTENTS =====================================================
var arrOfItemInBucket = [];

function listS3Content(params, persistFileName) {
    s3.listObjectsV2(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            if (data.Contents.length > 0) {
                data.Contents.forEach((elem, index) => {
                    arrOfItemInBucket.push([elem.Key, elem.LastModified, elem.Size])
                });
                params.StartAfter = data.Contents[data.Contents.length - 1].Key;
                listS3Content(params, persistFileName);
            } else {
                persistToExcel(persistFileName);
            }
        }
    });
}


//================================================================
function loadFileS3ToLocal(key) {
    var params = { Bucket: 'finanskutusu.mailbox', Key: key };

    var file = fs.createWriteStream(key.getObjFilePath());

    var error = false;
    s3.getObject(params)
        .createReadStream()
        .on('error', function(err) { //Handles errors on the read stream
            error = true;
            console.error('Error reading file:' + err, { Params: params });
            file.end();
            fs.unlink(key);
        })
        .pipe(file)
        .on('error', function(err) { //Handles errors on the write stream
            error = true;
            console.error('Error writing file:' + err, { Params: params });
            file.end();
            fs.unlink(key);

        })
        .on('finish', function() {
            file.end();
            if (!error) {
                console.log('Successfully downloaded from S3 ' + key);
            }
        });
}

//================================================================
function loadEboxMailS3ToLocal(key, path) {

    //Load From S3
    var params = { Bucket: 'eboxtestmailbox', Key: key };

    var file = fs.createWriteStream(path);

    var error = false;
    s3.getObject(params)
        .createReadStream()
        .on('error', function(err) { //Handles errors on the read stream
            error = true;
            console.error('Error reading file:' + err, { Params: params });
            file.end();
            fs.unlink(key);
        })
        .pipe(file)
        .on('error', function(err) { //Handles errors on the write stream
            error = true;
            console.error('Error writing file:' + err, { Params: params });
            file.end();
            fs.unlink(key);

        })
        .on('finish', function() {
            file.end();
            if (!error) {
                console.log('Successfully downloaded from S3 ' + key + ".display");
            }
        });
}

//================================================================
const fetchMail = (emailID) => {
    console.log("Fetch Mail " + emailID);
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(__dirname + "/../data/mailbox.xlsx")
        .then(function() {
            var worksheet = workbook.getWorksheet("mailbox");
            worksheet.eachRow(function(row, rowNo) {
                var key = row.getCell(1).value;
                if (key.includes(emailID)) {
                    fetchMailItem(key);
                }
            });
        });

}


//================================================================
const fetchMailItem = (key) => {
    if (fs.existsSync(key.getObjFilePath())) {
        console.log("It is exist.." + key);
    } else {
        console.log("Fetching  ..." + key);
        loadFileS3ToLocal(key, "");
    }
}

//================================================================
const fetchEboxMailItem = (key, path) => {
    loadEboxMailS3ToLocal(key, path);
}



//===============COPY S3 CONTENT =====================================================
const checkItemExist = (bucketName, objKey) => {
    //Load From S3
    var params = { Bucket: bucketName, Key: objKey };
    s3.headObject(params, function(err, metadata) {
        if (err && err.code === 'NotFound') {
            console.log(params.Key + " not found")
        } else {
            console.log(params.Key + " found");
        }
    });
}

//================================================================
const copyItemToOtherBucket = (sourceBucket, sourceKey, destionationBucket, destinationKey) => {
    var params = {
        Bucket: destionationBucket, //Destination
        CopySource: sourceBucket + sourceKey,
        Key: destinationKey
    };

    s3.copyObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });
}


//================================================================
const normalizeMailbox = () => {
    arr = [];
    arr.push("f8e93930-8afa-11e6-a61c-614cc81737c2@finanskutusu.com/dvrf57mckv1v5pklu567eo4lkt32qdg0bdfsvs81/.info");
    arr.push("f8e93930-8afa-11e6-a61c-614cc81737c2@finanskutusu.com/dvrf57mckv1v5pklu567eo4lkt32qdg0bdfsvs81/.display");
    arr.push("f8e93930-8afa-11e6-a61c-614cc81737c2@finanskutusu.com/dvrf57mckv1v5pklu567eo4lkt32qdg0bdfsvs81/.json");
    arr.push("f8e93930-8afa-11e6-a61c-614cc81737c2@finanskutusu.com/dvrf57mckv1v5pklu567eo4lkt32qdg0bdfsvs81/.xml");
    arr.forEach(elem => { copyItemToOtherBucket("/finanskutusu.mailbox/", elem, "finanskutusu", elem) })
}


//================================================
function persistToExcel(persistFileName) {
    var wb = new Excel.Workbook();

    //s3 Info
    var worksheet = wb.addWorksheet("s3info");
    worksheet.addRow(["name", "Golgi S3 Sync"]).commit();
    worksheet.addRow(["desc", "It Sync Keys finanskusutu.mailbox"]).commit();
    worksheet.addRow(["lastFetchTime", moment().format('MMMM Do YYYY, h:mm:ss a')]).commit();

    //mailbox
    var worksheet = wb.addWorksheet("mailbox");
    worksheet.addRow(["Key", "Last Modifed", "Size"]).commit();
    arrOfItemInBucket.forEach(function(elem) { worksheet.addRow(elem).commit(); });
    wb.xlsx.writeFile(__dirname + "/../data/" + persistFileName).then(function() { console.log("mailbox fetching finished"); });

}


//================================================================
const fetchBucket = (context, persistFileName) => {
    console.log("Scanning ...");
    listS3Content({ Bucket: context }, persistFileName);
}

// Export all methods
module.exports = { fetchBucket, fetchMail, fetchMailItem, normalizeMailbox, fetchEboxMailItem };