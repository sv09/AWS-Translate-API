// ** IMPORT REQUIRED PACKAGES AND FILES **

// ** express **
const express = require('express');
const app = express();

// ** cors **
var cors = require('cors')

// ** Swagger **
// const swaggerJsdoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');

// ** AWS CONFIG INFO FILE **
const awsConfig = require('./AWS-Access-keys/config.js');

// ** Define Port **
const port = process.env.port || 3000;


// ** SETTINGS AND CONFIGS **

// ** For Parsing Body Parameters **
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ** Cors Settings **
var corsOptions = {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
             "ETag",
             "x-amz-meta-custom-header"],
    // origin: 'http://example.com',
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

// ** Swagger Settings **   ????? Add IP Address
// const options = {
//     swaggerDefinition:{
//         info:{
//             title: 'ITIS-6177 AWS Translate',
//             version: '1.0.0',
//             description: 'ITIS-6177 Final Project to create API for utilizing AWS Translate service',
//             name: 'Shreya Vinodh'
//         },
//         host: ' ---- :3000',
//         basePath: '/',
//     },
//     apis: ['./api/translate/api.js'],
// };
// const specs = swaggerJsdoc(options);
// app.use('/api/translate/documentation', swaggerUi.serve, swaggerUi.setup(specs));


// ** AWS Config **
var AWS = require('aws-sdk');

AWS.config.update({
    region:awsConfig.region,
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
});
var translate = new AWS.Translate();

// AWS.config.credentials = new AWS.Credentials({
//     accessKeyId: awsConfig.accessKeyId, secretAccessKey: awsConfig.secretAccessKey, sessionToken: null});
//     AWS.config.region = awsConfig.region;
// app.use(cors());


// ** API END-POINTS **

// ** API for translating text from one language to another **
 app.get('/api/translate/text', cors(corsOptions), (req, res) => {
    try{
        // let TERMINOLOGY = [];
        let SOURCE_LANGUAGE = req.body.SOURCE_LANGUAGE;
        let TARGET_LANGUAGE = req.body.TARGET_LANGUAGE;
        let TEXT = req.body.TEXT;
        let terms = req.body.TERMINOLOGY;

        if(terms.length > 0){
            var params = {
                SourceLanguageCode: SOURCE_LANGUAGE,    /* required */
                TargetLanguageCode: TARGET_LANGUAGE,    /* required */
                Text: TEXT,                             /* required */
                TerminologyNames: terms
            };
        }else{
            var params = {
                SourceLanguageCode: SOURCE_LANGUAGE,    /* required */
                TargetLanguageCode: TARGET_LANGUAGE,    /* required */
                Text: TEXT,                             /* required */
            };
        }

        translate.translateText(params, function(err, data) {
            if (err) console.log(err, err.stack);       // an error occurred
            else{                                       // successful response
                console.log(data);                      
                // translatedText = data.TranslatedText;
                res.send(JSON.stringify({translatedText: data.TranslatedText}));
            }     
        });
    }catch(err){
        console.log('Error: ', err);
        res.send(err);
    }finally{
        //release variable memory after use
        SOURCE_LANGUAGE = "";
        TARGET_LANGUAGE = "";
        TEXT = "";
        TERMINOLOGY = [];
        terms = [];
    }
});


// ** API to create a new custom terminology file OR update an existing file **
app.put('/api/translate/custom-terminology', cors(corsOptions), (req, res) => {
    // let EncryptionKey = req.body.encryption;
    // let id = req.body.id;
    // let type = req.body.type;

    let SourceTerm = req.body.SourceTerm;
    let SourceLanguageCode = req.body.SourceLanguageCode;
    let TargetTerm = req.body.TargetTerm;                   //array
    let TargetLanguageCodes = req.body.TargetLanguageCodes; //array
    let FileName = req.body.FileName;                                  /* required */
    let description = req.body.description;

    const delimiter = ',';
    header = SourceLanguageCode + delimiter;
    header += TargetLanguageCodes.join(delimiter) + '\n';

    let row = [];
    let rows = [];
    // var count = TargetLanguageCodes.length;
    row.push(SourceTerm); 
    TargetTerm.forEach(trgt => {
        // var i=0;
        // let row = []
        // while(i < count){
        row.push(trgt);
        // i += 1;
        // }
        // rows.push(row);
    });
    rows.push(row);

    var csvFile = header;
    // csvFile += SourceTerm + delimiter;
    rows.forEach(element => {
        csvFile += element.join(delimiter) + '\n'; 
    });

    let merge = 'OVERWRITE';
    let format = 'CSV';

    
    // if(description){
    var input = {
        Description: description,
        MergeStrategy: merge,
        Name: FileName,
        TerminologyData: { 
        File: Buffer.from(csvFile),
        Format: format
        }
    }
    // }else{
    //     var input = {
    //         MergeStrategy: merge,
    //         Name: FileName,
    //         TerminologyData: { 
    //         File: Buffer.from(csvFile),
    //         Format: format
    //         }
    //     } 
    // }

    translate.importTerminology(input ,function(err, data){
        if (err) console.log(err, err.stack);       // an error occurred
        else{                                       // success
            console.log(data);
            // res.send('Custom Terminology file added/updated');
            res.send(JSON.stringify({ 
                Name:data.TerminologyProperties.Name, 
                CreatedAt:data.TerminologyProperties.CreatedAt,
                LastUpdatedAt:data.TerminologyProperties.LastUpdatedAt
            }));
        }                  
    });
});


// ** API to list all the custom terminology files associated with the profile ** 
app.get('/api/translate/list-terminology', cors(corsOptions), (req, res) =>{
    translate.listTerminologies(function(err, data){
        if(err) console.log(err, err.stack);        //error occured
        else{                                       //success
            console.log(data);
            let file_names=[];
            data.TerminologyPropertiesList.forEach(obj => {
                file_names.push({Name:obj.Name, Description:obj.Description});
            });
            res.send(JSON.stringify(file_names));
        }
    });
});


// ** API to delete a particular custom terminology file **
app.delete('/api/translate/delete-terminology', cors(corsOptions), (req, res) =>{
    let TerminologyName = req.body.TerminologyName;

    var terminologyName = {
        Name: TerminologyName
    }

    translate.deleteTerminology(terminologyName, function(err, data){
        if(err) console.log(err, err.stack);        //error occured
        else{                                       //success
            console.log(data);
            res.send('Deleted the Custom Terminology file');
        }
    });

});

app.listen(port, () => {
    console.log(`Server started on ${port}`);
});