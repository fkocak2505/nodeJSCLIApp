const parse = require('emailjs-mime-parser').default;
const fs = require("fs");
const TextDecoder = require('text-encoding').TextDecoder;
const striptags = require('striptags');
const sanitizeHtml = require('sanitize-html');
const pdfUtil = require('pdf-to-text');


//=========PARSE =======================================================
const parseEmailItemContent = (fileName, mimeArr, doneCallback) => {
    //console.log("$ golgi parse email");
    fs.readFile("data/objs/" + fileName, 'utf-8', function(err, content) {
        if (err) {
            console.log(err);
            return doneCallback(err);
        }
        var mimeNode = parse(content);
        convertMimeTree2Arr(fileName, mimeNode, mimeArr);
        return doneCallback(null);
    });
}

//================================================================
const formatContent = (content) => {
    let sContent = sanitizeHtml(content);
    sContent = striptags(sContent);
    return sContent;
}


//================================================================
const convertMimeTree2Arr = (fileName, node, mimeArr) => {
    //let content = new TextDecoder("windows-1254").decode(node.content);
    let content = new TextDecoder("utf-8").decode(node.content);
    if (content.length > 0) {
        node.fileName = fileName;
        mimeArr.push(node);
    }

    node.childNodes.forEach(childNode =>
        convertMimeTree2Arr(fileName, childNode, mimeArr)
    );
}


//================================================================
var mimeCounter = 0;
const renderMimeNode = (node, fileName, doneCallback) => {
    console.log("=====CHILD ========= \n\n")
    let sContentType = JSON.stringify(node.contentType);
    console.log("contentType:" + sContentType);
    if (sContentType.includes("text/html")) {
        writeNodeHTMLContent(node, fileName, "html", doneCallback);
    } else if (sContentType.includes("pdf")) {
        writeNodePDFContent(node, fileName, "pdf", doneCallback);
    } else {
        console.log("others..");
        return doneCallback(null);
    }

}

//================================================================
const writeNodePDFContent = (node, fileName, ext, doneCallback) => {
    mimeCounter++;
    checkDisplayFolder();
    fileName = fileName.replace('__.unstructured', '');
    let filePath = __dirname + "/../data/displays/" + fileName + "__" + mimeCounter + "." + ext;
    fs.writeFile(filePath, node.content, function(err) {
        if (err) {
            return doneCallback(err);
        }

        console.log("pdf file was saved!");
        return doneCallback(null);
    });

}

//================================================================
const writeNodeHTMLContent = (node, fileName, ext, doneCallback) => {
    mimeCounter++;
    checkDisplayFolder();
    fileName = fileName.replace('__.unstructured', '');
    let filePath = __dirname + "/../data/displays/" + fileName + "__" + mimeCounter + "." + ext;
    fs.writeFile(filePath, node.content, function(err) {
        if (err) {
            return doneCallback(err);
        }

        console.log("html file was saved!");
        return doneCallback(null);
    });

}

//================================================================
function checkDisplayFolder() {
    var dir = __dirname + '/../data/displays';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

// Export all methods
module.exports = {
    parseEmailItemContent,
    renderMimeNode
    //variableName: mimeArr
};