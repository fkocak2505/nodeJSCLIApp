var fs = require('fs');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


String.prototype.getObjFilePath = function() {
    var dir = __dirname + "/../data/objs/";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var key = this.replaceAll("/", "__")
    var filePath = __dirname + "/../data/objs/" + key;
    return filePath
};

String.prototype.getObjFilePath4UnstructuredJSON = function() {
    var dir = __dirname + '/../data/samplings';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var key = this.replaceAll("/", "__")
    key = key.replace('__.unstructured','');
    var filePath = __dirname + "/../data/samplings/" + key;
    return filePath
};

String.prototype.getObjFilePath4eBoxMail = function() {
    var dir = __dirname + '/../data/eboxmailWithExt/';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var filePath = __dirname + "/../data/eboxmailWithExt/" + this;
    return filePath
};


String.prototype.getObjFilePathEbox = function() {
    var dir = __dirname + '/../data/eboxmail/';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var key = this.replaceAll("/", "__")
    var filePath = __dirname + '/../data/eboxmail/' + key;
    return filePath
};