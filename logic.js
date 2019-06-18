const s3 = require("./adapters/s3Adapter");
const lStorage = require("./lStorage/localStorage");
const dynamoDB = require("./adapters/dynamodbAdapter")

//================================================================
const fetch = (context, id) => {
    switch (context) {
        case "finanskutusu.mailbox":
            s3.fetchBucket(context, "mailbox.xlsx");
            break;
        case "finanskutusu.mail":
            s3.fetchBucket(context, "mail.xlsx");
            break;
        case "finanskutusu.ses":
            s3.fetchBucket(context, "ses.xlsx");
            break;
        case "finanskutusu.uploads":
            s3.fetchBucket(context, "uploads.xlsx");
            break;
        case "allInvoice":
            dynamoDB.fetchInvoiceFromDynamoDB(context, "invoice.xlsx");
            break;
        case "email":
            if (id == undefined) console.log("Please Enter mailID");
            else s3.fetchMail(id);
            break;
        case "item":
            if (id == undefined) console.log("Please Enter ObjKey");
            else s3.fetchMailItem(id);
            break;
        case "unstructured":
            lStorage.fetchUnstructured(s3);
            break;
        case "eboxtestmailbox":
            s3.fetchBucket(context, "eboxtestmailbox.xlsx");
            break;
        default:
            console.log("Unknown Context");
            break;

    }

};

//================================================================
const info = (context, id) => {
    switch (context) {
        case "s3":
            lStorage.getInfo();
            break;
        case "mailbox":
            lStorage.getMailboxInfo();
            break;
        case "email":
            lStorage.getMail(id);
        case "item":
            lStorage.getItemInfo(id);
            break;
        default:
            console.log("Unknown Context");
            break;

    }

};

//================================================================
const list = (context, id) => {
    switch (context) {
        case "accounts":
            lStorage.listAccounts();
            break;
        case "emails":
            lStorage.listEmails(id);
            break;
        case "email":
            lStorage.listEmail(id);
            break;
    }
};

//================================================================
const listDetail = (context, id, options) => {
    //console.log(options);
    switch (context) {
        case "accounts":
            if (options.detail_mode == "count")
                lStorage.listAccountsWithEmailCount();
            break;
        case "emails":
            if (options.detail_mode == "types")
                lStorage.listEmailsWithType(id);
    }
};


//================================================================
const show = (id) => {
    lStorage.showItemContent(id);
};

//================================================================
const parseMail = (id, options) => {
    lStorage.parseEmailItemContent(id, options);
};

//================================================================
const filter = (options) => {
    lStorage.filterMailbox(options);
};

//================================================================
const debug = (context) => {
    if (context == ".unstructured") {
        lStorage.debugUnstructuredFlow();
    } else if (context == "mailbox") {
        lStorage.debugMailbox();
    }
};

//================================================================
const normalize = (context) => {
    if (context == "mailbox") {
        s3.normalizeMailbox();
    }
};

//================================================================
const generate = (context, options) => {
    switch (context) {
        case "samplings":
            lStorage.generateModelData(s3);
            break;
        case "displays":
            lStorage.generateDisplayFile(s3);
            break;
        case "eboxmail":
            lStorage.loadFileS3ToLocal(s3);
            break;
        case "eboxtestmailbox":
            lStorage.generateEboxMailType();
            break;
        case "eboxsamplings":
            lStorage.generateEboxSamplings();
            break;
        default:
            console.log(context + " context yanlış");
    }
}

//================================================================
const puts3 = (context, options) => {
    switch (context) {
        case "displays":
            lStorage.puts3DisplayFile();
            break;
        default:
            console.log("Context adı Geçerli değil..!");
    }
}

//================================================================
const scanAllInvoice = (context, options) => {
    lStorage.scanAllInvoice(context, options);
}


//================================================================
const createTable = (tableName, options) => {
    dynamoDB.createTable(tableName);
}

//================================================================
const deleteTable = (tableName) => {
    dynamoDB.deleteTable(tableName);
}

//================================================================
const putItem = (tableName) => {
    dynamoDB.putItem(tableName);
}






// Export all methods
module.exports = {
    fetch,
    info,
    list,
    listDetail,
    show,
    parseMail,
    filter,
    debug,
    normalize,
    generate,
    scanAllInvoice,
    puts3,
    createTable,
    deleteTable,
    putItem
};