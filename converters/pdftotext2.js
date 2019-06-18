var functionResponse = require('../commons/functionResponse');
var PDFExtract = require('pdf.js-extract').PDFExtract;


var pdfExtract = new PDFExtract();
var options = {}; 


const pdfExtractFile = (pdfFile, fnCallback) => {
    let response = new FunctionResponse("pdfExtractFile", [pdfFile, fnCallback]);

    pdfExtract.extract(pdfFile, options, function(err, data) {
        if (err) {
            response.setErr(err);
            fnCallback(response);
        } else {
            var pagesText = [];
            //console.log(data.pages[0].content);
            data.pages.forEach(page => pagesText.push(formatPage(page.content)));
            response.setData(pagesText);
            return fnCallback(response);
        }
    });
}


const formatPage = (content) => {

    let formattedContent = "";
    let arr = content;
    let mapLine = {}

    //Align And Normalize Y axis .. 
    arr.forEach(elem => {
        let y = parseInt(elem.y);
        let mapObj = undefined;
        if (mapLine[y] == undefined && mapLine[y - 1] == undefined && mapLine[y + 1] == undefined) {
            mapLine[y] = [];
            mapObj = mapLine[y]
        } else if (mapLine[y] != undefined) mapObj = mapLine[y];
        else if (mapLine[y - 1] != undefined) mapObj = mapLine[y - 1];
        else if (mapLine[y + 1] != undefined) mapObj = mapLine[y + 1];
        elem.startPos = parseInt(elem.x);
        elem.endPos = parseInt(elem.x + elem.width);
        mapObj.push(elem);
    });


    let arrLine = [];
    for (key in mapLine) {
        arrLine.push({ y: key, arr: mapLine[key] });
    }

    arrLine = arrLine.sort((a, b) => {
        return a.y - b.y;
    });


    //Align And Normalize X Axis
    arrLine.forEach(line => {
        let sortedLine = line.arr.sort((a, b) => {
            return a.x - b.x;
        });

        let lineStr = "";
        let deltaX = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < sortedLine.length; i++) {
            let e = sortedLine[i];

            if (i > 0) {
                let prevE = sortedLine[i - 1];
                deltaX = e.startPos - prevE.endPos
            }


            if (deltaX > 1) {
                lineStr += "         " + e.str;
            } else {
                lineStr += e.str;
            }
        }

        formattedContent += lineStr.trim() + "\n";
    });


    return formattedContent;

};



module.exports = {
    pdfExtractFile
};