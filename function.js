const fs = require("fs");
const fastCsv = require("fast-csv");
const { stringify } = require("csv-stringify");

//Set Options to read data without headers
const options = {
    objectMode: true,
    delimiter: ",",
    quote: null,
    headers: false,
    renameHeaders: false,
};

//MODIFY INPUTS
let inputFolder = "stock_price_data_files (1)\\NASDAQ";
let numberofFiles = 2;


//Get files to process
fs.readdir(inputFolder, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //Process files one by one
    for (i = 0; i <= files.length - 1; i++) {
        returnDataPoints(inputFolder, files[i]).then((e) => {
            console.log("Procesing file"+" "+e[2]);
            if (e[0].length != 0) {
                computePrediction(e);
            }
        });
    //Ensure you process only the number of files indicated or lower
        if (numberofFiles == 1 || i == numberofFiles) {
            break;
        }


    }

});

//Function for reading the csv file
function returnDataPoints(inputFolder, fileName) {
    let rows = [];

    return new Promise((res, rej) => {
        
        fs.createReadStream(inputFolder + "\\" + fileName)
        
            .pipe(fastCsv.parse(options))
            .on("error", (error) => {
                console.log(error);
                rej([error,inputFolder,fileName]);
            })
            .on("data", (row) => {

                
             rows.push(row);

            })
            .on("end", (rowCount) => {
           
                let extractData = [];
                if (rowCount == 0) {

                    res([extractData, inputFolder, fileName]);
                }
                else {
                    let randomIndex = getRandomIndex(rowCount);

                    for (let i = randomIndex; i <= randomIndex + 9; i++) {
                        extractData.push(rows[i]);
                    }
                    res([extractData, inputFolder, fileName]);

                }
            }
            );
        function getRandomIndex(count) {
            return Math.floor(Math.random() * (count - 9));
        }

    })

}


//Funtion to compute the Stock Price
function computePrediction(input) {

    try {
        let data = input[0];
        let inputFolder = input[1];
        let fileName = input[2];

        let valuesArr = [];
        //Assign n as the last value from the array
        let n = parseFloat(data[data.length - 1][2]);
        //Insert the second biggest value as n+1 in final array
        valuesArr.push(findSecondBiggest(data));
        //Compute n+2 as n+(n1-n)/2 and insert in final array
        let n2 = n + Math.round((Math.abs(valuesArr[0] - n) / 2) * 100) / 100;
        valuesArr.push(n2);
         //Compute n+3 as n1+(n2-n1)/4 and insert in final array
        valuesArr.push(n2 + Math.round((Math.abs(valuesArr[1] - valuesArr[0]) / 4) * 100) / 100);
        // Get Index for crrent document
        let index = data[data.length - 1][0];
        // Get the last date from the array and convert it to date so that we can build the dates for the other three dates
        let dateArr=[];let lastDate;
        console.log(data[data.length - 1][1]);
         dateArr = data[data.length - 1][1].split('-');
         console.log(dateArr);
        if(dateArr.length==1){
            let dateArr = data[data.length - 1][1].split('/');
            lastDate = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);  
        } else{
         lastDate = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);}
        //Insert the three rows in the table
        for (i = 0; i < 3; i++) {
            let currentDate = new Date(lastDate.setDate(lastDate.getDate() + 1));
            let currentDateString = currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear();
            let array = [index, currentDateString, valuesArr[i]];
            data.push(array);
            lastDate = currentDate;
        }
        //Write data to csv
        let writableStream = fs.createWriteStream(inputFolder + "\\" + "Extract_" + fileName);

        let stringifier = stringify();
        data.forEach((row) => {

            stringifier.write(row);
        });
        stringifier.pipe(writableStream);
        console.log("Finished writing data");
    }
    catch (err) {
        console.log("File is empty or data is corrupt"+err);
    }


}

function findSecondBiggest(data) {
    let array = [];
    data.forEach((value) => array.push(value[2]));
    array.sort((a, b) => a - b);
    let secondLargest = array[array.length - 1];
    let i = array.length - 2;
    while (secondLargest == array[array.length - 1] && i >= 0) {
        secondLargest = array[i];
        i--;
    }
    return secondLargest;
}