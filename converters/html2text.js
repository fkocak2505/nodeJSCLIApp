const htmlToText = require('html-to-text');
const fs = require("fs");
var functionResponse = require('../commons/functionResponse');

function html2Text(name, fnCallback) {
    //console.log("Html " + name);
    convert(name, (fResp) => {
        if (fResp.err != undefined) fnCallback(fResp.err);
        else return fnCallback(fResp.data);
    });
}

const convert = (inFilePath, fnCallback) => {
    var this_fResp = new FunctionResponse("convert", [inFilePath, fnCallback]);
    htmlToText.fromFile(inFilePath, {}, (err, text) => {
        if (err) this_fResp.setErr(err);
        else this_fResp.setData(text);
        fnCallback(this_fResp);
    });
}

//html2Text("data/eboxmailWithExt/0158eb01-a923-4398-be8d-3d00e78ae844.html");

module.exports = {
    html2Text
};