const parse = require('emailjs-mime-parser').default;
const fs = require("fs");
const TextDecoder = require('text-encoding').TextDecoder;
const striptags = require('striptags');
const sanitizeHtml = require('sanitize-html');
const pdfUtil = require('pdf-to-text');
const pdfToTextConvertor = require('../converters/pdftotext2');


//=========PARSE =======================================================
const parseEmailItemContent = (fileName, mapOfArr) => {
    console.log("$ golgi parse email");
    fs.readFile(__dirname + "/../data/objs/" + fileName, 'utf-8', function(err, content) {
        if (err) {
            console.log(err);
            return;
        }
        var mimeNode = parse(content);

        fileName = fileName.replaceAll("__", "/");
        mapOfArr[fileName] = [];
        renderMimeNode(mimeNode, fileName, mapOfArr);
    });
}

//================================================================
const formatContent = (content) => {
    let sContent = sanitizeHtml(content);
    sContent = striptags(sContent);
    return sContent;
}

//================================================================
var mimeCounter = 0;
const renderMimeNode = (node, fileName, mapOfArr) => {
    //let content = new TextDecoder("windows-1254").decode(node.content);
    let content = new TextDecoder("utf-8").decode(node.content);
    if (content.length > 0) {
        console.log("=====CHILD ========= \n\n")
        let sContentType = JSON.stringify(node.contentType);
        console.log("contentType:" + sContentType);
        if (sContentType.includes("text/html")) {
            writeNodeHTMLContent(content, fileName, "html", mapOfArr);
        } else if (sContentType.includes("pdf")) {
            writeNodePDFContent(node, fileName, "pdf", mapOfArr);
        }
    }

    node.childNodes.forEach(childNode =>
        renderMimeNode(childNode, fileName, mapOfArr)
    );
}


//================================================================
const writeNodePDFContent = (node, fileName, ext, mapOfArr) => {
    mimeCounter++;
    //let filePath = "data/objs/" + fileName + "_" + mimeCounter + "." + ext;
    var objItem = { id: fileName, formatType: ext, content: -1 };
    mapOfArr[fileName].push(objItem);

    fileName = fileName.replaceAll("/", "__");
    let filePath = __dirname + "/../data/objs/" + fileName + "__" + mimeCounter + "." + ext;
    fs.writeFile(filePath, node.content, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
        //convertPDF2Text(filePath, objItem);
        convertPDF2TextWithPosAttr(filePath, objItem);
    });

}

//================================================================
const writeNodeHTMLContent = (content, fileName, ext, mapOfArr) => {
    mimeCounter++;
    mapOfArr[fileName].push({ id: fileName, formatType: ext, content: formatContent(content), contentSize: formatContent(content).length });
    let filePath = __dirname + "data/objs/" + fileName + "__" + mimeCounter + "." + ext;
}

//================================================================
const convertPDF2Text = (filePath, objItem) => {
    console.log(filePath);
    //Omit option to extract all text from the pdf file
    pdfUtil.pdfToText(filePath, function(err, data) {
        if (err) {
            console.log(err);
            objItem.content = "";
            objItem.contentSize = 0;
        }
        //console.log(data); //print all text  
        else {
            objItem.content = data;
            objItem.contentSize = data.length;
        }
    });
}


//================================================================
const fixedUTF8Problems = (content) => {
    //New Convertor
    return content;
}



//================================================================
const convertPDF2TextWithPosAttr = (filePath, objItem) => {
    pdfToTextConvertor.pdfExtractFile(filePath, fResp => {
        if (fResp.err != undefined) {
            console.log(err);
            objItem.content = "";
            objItem.contentSize = 0;
        } else {
            let content = "";
            fResp.data.forEach(page => content += page);
            objItem.content = content;
            objItem.contentSize = content.length;
        }
    });
}



// Export all methods
module.exports = {
    parseEmailItemContent
};