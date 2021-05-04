// ** IMPORT REQUIRED PACKAGES AND FILES **

// ** express **
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// ** cors **
var cors = require('cors')

// ** Swagger **
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// ** AWS CONFIG INFO FILE **
const awsConfig = require('./AWS-Access-keys/config.js');

// ** Define Port **
const port = process.env.port || 3000;


// ** SETTINGS AND CONFIGS **

// ** For Parsing Body Parameters **
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

//** Swagger Settings **   ????? Add IP Address
const options = {
    swaggerDefinition:{
        info:{
            title: 'Translate Text',
            version: '1.0.0',
            description: 'Translate your text into a language that you desire by utilizing Amazon Translate service. <br /> <br /> Know more about Amazon Translate [here](https://docs.aws.amazon.com/translate/latest/dg/what-is.html) <br /> Find a list of the supported languages and their language codes [here](https://docs.aws.amazon.com/translate/latest/dg/what-is.html#what-is-languages) <br /> <br /> Use __/text__ API to translate the text from a source language to a target language. <br /> Use __/custom-terminology__ API to define/update your customization for a term. <br /> Use __/list-terminology__ API to list all the customization files defined. <br /> Use __/delete-terminology__ API to delete a particular customization file.',
        },
        host: 'localhost:3000',
        basePath: '/api/translate/',
    },
    apis: ['./api.js'],
};
const specs = swaggerJsdoc(options);
app.use('/api/translate/documentation', swaggerUi.serve, swaggerUi.setup(specs));
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json());

// ** AWS Config **
var AWS = require('aws-sdk');

AWS.config.update({
    region:awsConfig.region,
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
});
var translate = new AWS.Translate();
app.use(cors());


// ** API END-POINTS **

/**
 * @swagger
 * /text:
 *    get:
 *      summary: Translate a text to another language.
 *      description: Returns the text provided in a source language translated to the target language (with customizations if specified). If no customization required, leave the 'TERMINOLOGY' array blank. <br /><br /> Why customization? <br /> For keeping a term intact throughout the translation regardless of the language. <br /> For example - 'United States' is translated to 'États-Unis' in French ("fr"). If you want this to be 'United States' in the French translation, you can define a customization file. <br /> <br /> Please refer to __'/list-terminology'__ API to see the list of terminology files present OR refer to __'/custom-terminology'__ API to define one. <br /><br /> Please refer to the 'Find more details' section for the compatible languages for customization.
 *      externalDocs:
 *          description: Find the list the compatible languages for customization
 *          url: https://docs.aws.amazon.com/translate/latest/dg/permissible-language-pairs.html
 *      consumes:
 *          - application/json
 *      parameters:
 *          - in: body
 *            description: Codes for the source as well as the target languages, the text to be translated, and the customization file to be used. Everything inside the quotes. <br /> <br /> - __SOURCE_LANGUAGE__ -- Source language code of your text ( __Minimum length of 2 and Maximum length of 5__ ). For example - "en" <br /> <br /> - __TARGET_LANGUAGE__ - Target language code you want the text to be translated to ( __Minimum length of 2 and Maximum length of 5__ ). For example - "fr" <br /><br /> - __TEXT__ -- The text (in the source languge) you want to be tranlated ( __Maximum of 5,000 bytes long and Minimum length of 1__ ). <br /> <br /> - __TERMINOLOGY__ -- The name of the customization file; Please provide only 1 customization filename in the array. <br /><br /><br /> CLICK ON 'Model' TO CHECK FOR THE REQUIRED FIELDS
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - SOURCE_LANGUAGE
 *                  - TARGET_LANGUAGE
 *                  - TEXT
 *              properties:
 *                  SOURCE_LANGUAGE:
 *                      type: string
 *                  TARGET_LANGUAGE:
 *                      type: string
 *                  TEXT:
 *                      type: string
 *                  TERMINOLOGY:
 *                      type: array
 *                      items:
 *                          type: string
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successful - Successfully returned an object with the translated text.
 *          400:
 *              description: InvalidParameterValueException - An invalid or out-of-range value was supplied for the input parameter.
 *          432:
 *              description: DetectedLanguageLowConfidenceException - The confidence that Amazon Comprehend accurately detected the source language is low. If a low confidence level is acceptable for your application, you can use the language in the exception to call Amazon Translate again.
 *          433:
 *              description: InvalidRequestException - The request that you made is invalid. Check your request to determine why it's invalid and then retry the request.
 *          434:
 *              description: ResourceNotFoundException - The resource you are looking for has not been found. Review the resource you're looking for and see if a different resource will accomplish your needs before retrying the revised request.
 *          435:
 *              description: TextSizeLimitExceededException - The size of the text you submitted exceeds the size limit. Reduce the size of the text or use a smaller document and then retry your request.
 *          436:
 *              description: UnsupportedLanguagePairException - Amazon Translate does not support translation from the language of the source text into the requested target language. 
 *          437:
 *              description: TooManyRequestsException - You have made too many requests within a short period of time. Wait for a short time and then try your request again.
 *          404:
 *              description: Error - A required parameter for the specified action is not supplied.
 *          500:
 *              description: InternalServerException - An internal server error occurred. Please check the validity of the parameters and retry your request.
 */
app.get('/api/translate/text', cors(corsOptions), (req, res) => {
    try{
        //sanitization and Validation

        if(req.body.SOURCE_LANGUAGE.length >= 2 && req.body.SOURCE_LANGUAGE.length <= 5){
            SOURCE_LANGUAGE = req.body.SOURCE_LANGUAGE;
        }

        if(req.body.TARGET_LANGUAGE.length >= 2 && req.body.TARGET_LANGUAGE.length <= 5){
            TARGET_LANGUAGE = req.body.TARGET_LANGUAGE;
        }

        if(/^([A-Za-z0-9-]_?)+$/.test(req.body.TERMINOLOGY[0])){
            terms = req.body.TERMINOLOGY; 
        }

        if(req.body.TEXT.length > 1 && req.body.TEXT.length <= 5000){
            TEXT = req.body.TEXT;
        }

        if(SOURCE_LANGUAGE && TARGET_LANGUAGE && terms && TEXT){
            var params = {
                SourceLanguageCode: SOURCE_LANGUAGE,    /* required */
                TargetLanguageCode: TARGET_LANGUAGE,    /* required */
                Text: TEXT,                             /* required */
                TerminologyNames: terms           
            };
        }
        
        if(params){
            translate.translateText(params, function(err, data) {
                if (err){                                   // an error occurred
                    console.log(err, err.stack);
                    if(err['code'] == 'InvalidParameterValueException'){
                        res.status(400);
                    }else if(err['code'] == 'DetectedLanguageLowConfidenceException'){
                        res.status(432);
                    }else if(err['code'] == 'InvalidRequestException'){
                        res.status(433);
                    }else if(err['code'] == 'ResourceNotFoundException'){
                        res.status(434);
                    }else if(err['code'] == 'TextSizeLimitExceededException'){
                        res.status(435);
                    }else if(err['code'] == 'UnsupportedLanguagePairException'){
                        res.status(436);
                    }else if(err['code'] == 'TooManyRequestsException'){
                        res.status(437);
                    }else if(err['code'] == 'InternalServerException'){
                        res.status(500);
                    }else{
                        res.status(404);
                    }
                    res.send(err);
                }       
                else{                                       // successful response
                    console.log(data);
                    res.status(200);                  
                    res.send(JSON.stringify({translatedText: data.TranslatedText}));
                }
            }); 
        }     
    }catch(err){
        console.log('Error: ', err);
        throw err;
    }finally{
        //release variable memory after use
        SOURCE_LANGUAGE = "";
        TARGET_LANGUAGE = "";
        TEXT = "";
        terms = [];
    }
});


// ** API to create a new customization file OR update an existing customization file **
/**
 * @swagger
 * /custom-terminology:
 *    put:
 *      summary: Customize a terminology to appear the way you want in your translated text.
 *      description: Create a new file or update an existing file in the backend with a terminology the way you want it to appear in your translated text. Please create 1 file per terminology. <br /> For example - 'United States' is translated to 'États-Unis' in French ("fr"). If you want this to be 'United States' in the French translation, you can define a customization file for this term. <br /><br /> __NOTE - The source word within a custom terminology is case-sensitive and will not work for words that are not an exact match.__ <br /><br /><br /> Please refer 'Find more details' section for compatible languages for customization.
 *      externalDocs:
 *          description: Find the list of the compatible languages
 *          url: https://docs.aws.amazon.com/translate/latest/dg/permissible-language-pairs.html
 *      consumes:
 *          - application/json
 *      parameters:
 *          - in: body
 *            description: <br /> - __description__ -- A description about the custom file. <br /> <br /> - __SourceLanguageCode__ -- Code for source language ( __Minimum length of 2 and Maximum length of 5__ ). For example - "en" <br /> <br /> - __SourceTerm__ -- The term to be customized (provide the term in the source language). For example - "United States" <br /> <br />  - __TargetLanguageCodes__ -- Array of code(s) for the target language(s) - multiple target language codes can be specified ( Each code __Minimum length of 2 and Maximum length of 5__ ). For example - ["fr", "de"] <br /> <br /> - __TargetTerm__ -- Array of the term you want in the translated text - provide the term corresponding to each language code specified in 'TargetLanguageCodes'. For example - ["United States", "United States"] for ["fr", "de"] ; ["United States"] for ["fr"] etc. <br /> <br /> - __FileName__ -- Provide a name for the file ( __Minimum length of 1 and Maximum length of 256__ ). Providing a file with the same name as an existing one will overwrite the content with the new definition (the overwritten terminology may take up to 10 minutes to fully propagate and be available for use in the translation). <br /><br /><br /> CLICK ON 'Model' TO CHECK FOR THE REQUIRED FIELDS
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - SourceLanguageCode
 *                  - SourceTerm
 *                  - TargetLanguageCodes
 *                  - TargetTerm
 *                  - FileName
 *              properties:
 *                  description:
 *                      type: string
 *                  SourceLanguageCode:
 *                      type: string
 *                  SourceTerm:
 *                      type: string
 *                  TargetLanguageCodes:
 *                      type: array
 *                      items:
 *                          type: string
 *                  TargetTerm:
 *                      type: array
 *                      items:
 *                          type: string
 *                  FileName:
 *                      type: string
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successful - Successfully created the customization file.
 *          400:
 *              description: InvalidParameterValueException - An invalid or out-of-range value was supplied for the input parameter.
 *          436:
 *              description: LimitExceededException - The specified limit has been exceeded. Review your request and retry it with a quantity below the stated limit.
 *          437:
 *              description: TooManyRequestsException - You have made too many requests within a short period of time. Wait for a short time and then try your request again.
 *          404:
 *              description: Error - A required parameter for the specified action is not supplied.
 *          500:
 *              description: InternalServerException - An internal server error occurred. Please check the validity of the parameters and retry your request.
 */
 app.put('/api/translate/custom-terminology', cors(corsOptions), (req, res) => {
    
    //sanitization and validation

    if(req.body.description){
        if(req.body.description.length >= 1 && req.body.description.length <= 256){
            description = req.body.description;
        }
    }else{
        description = req.body.description;
    }

    if(req.body.SourceLanguageCode.length >= 2 && req.body.SourceLanguageCode.length <= 5){
        SourceLanguageCode = req.body.SourceLanguageCode;
    }
    
    var i;
    var CodeFlag = true;
    for(i=0; i<req.body.TargetLanguageCodes.length; i++){
        if(req.body.TargetLanguageCodes[i].length >= 2 && req.body.TargetLanguageCodes[i].length <= 5){
            continue 
        }else{
            CodeFlag = false;
        }
    }
    if(CodeFlag){
        TargetLanguageCodes = req.body.TargetLanguageCodes;
    }

    if(req.body.SourceTerm.length >=1 && req.body.SourceTerm.length <= 5000){
        SourceTerm = req.body.SourceTerm;
    }

    var j;
    var TermFlag = true;
    for(j=0; j<req.body.TargetTerm.length; j++){
        if(req.body.TargetTerm[j].length >= 1 && req.body.TargetTerm[j].length <= 5000){
            continue 
        }else{
            TermFlag = false;
        }
    }
    if(TermFlag){
        TargetTerm = req.body.TargetTerm;
    }

    if(req.body.FileName.length >= 1 && req.body.FileName.length <= 256){
        FileName = req.body.FileName;
    }

    if(SourceLanguageCode && TargetLanguageCodes && SourceTerm && TargetTerm && FileName){
        const delimiter = ',';
        header = SourceLanguageCode + delimiter;
        header += TargetLanguageCodes.join(delimiter) + '\n';

        let row = [];
        let rows = [];
        row.push(SourceTerm); 
        TargetTerm.forEach(trgt => {
            row.push(trgt);
        });
        rows.push(row);

        var csvFile = header;
        rows.forEach(element => {
            csvFile += element.join(delimiter) + '\n'; 
        });

        let merge = 'OVERWRITE';
        let format = 'CSV';

        
        var input = {
            Description: description,
            MergeStrategy: merge,
            Name: FileName,
            TerminologyData: { 
            File: Buffer.from(csvFile),
            Format: format
            }
        }
    }
    
    if(input){
        translate.importTerminology(input ,function(err, data){
            if (err){                                   // an error occurred
                console.log(err, err.stack);
                if(err['code'] == 'InvalidParameterValueException'){
                    res.status(400);
                }else if(err['code'] == 'LimitExceededException'){
                    res.status(436);
                }else if(err['code'] == 'TooManyRequestsException'){
                    res.status(437);
                }else if(err['code'] == 'InternalServerException'){
                    res.status(500);
                }else{
                    res.status(404);
                }
                res.send(err);
            } 
            else{                                       // success
                console.log(data);
                res.status(200);
                res.send(JSON.stringify({ 
                    Name:data.TerminologyProperties.Name, 
                    CreatedAt:data.TerminologyProperties.CreatedAt,
                    LastUpdatedAt:data.TerminologyProperties.LastUpdatedAt
                }));
            }                  
        });
    }else{
        res.status(404);
        res.send('Missing 1 or more required parameters');
    }
});


// ** API to list all the custom terminology files associated with the profile ** 
/**
 * @swagger
 * /list-terminology:
 *    get:
 *      summary: List all the customization files
 *      description: Returns the list of the customization files. 
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successful - Successfully returned an object with the list of all the customization file.
 *          400:
 *              description: InvalidParameterValueException - The value of the parameter is invalid. Review the value of the parameter you are using to correct it, and then retry your operation.
 *          404:
 *              description: Error
 *          500:
 *              description: InternalServerException - An internal server error occurred. Please check the validity of the parameters and retry your request.
 */
app.get('/api/translate/list-terminology', cors(corsOptions), (req, res) =>{
    translate.listTerminologies(function(err, data){
        if(err){                                    //error occured
            console.log(err, err.stack); 
            if(err['code'] == 'InvalidParameterValueException'){
                res.status(400);
            }else if(err['code'] == 'InternalServerException'){
                res.status(500);
            }else{
                res.status(404);
            }
            res.send(err);
        }                             
        else{                                       //success
            console.log(data);
            let file_names=[];
            data.TerminologyPropertiesList.forEach(obj => {
                file_names.push({Name:obj.Name, Description:obj.Description});
            });
            res.status(200);
            res.send(JSON.stringify(file_names));
        }
    });
});


// ** API to delete a particular custom terminology file **
/**
 * @swagger
 * /delete-terminology:
 *    delete:
 *      summary: Delete a customization file
 *      description: Returns a message if the deletion process is successful.
 *      consumes:
 *          - application/json
 *      parameters:
 *          - in: body
 *            description: The name of the customization file to be deleted ( __Minimum length of 1 and Maximum length of 256__ ). <br /><br /><br /> CLICK ON 'Model' TO CHECK FOR THE REQUIRED FIELDS
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - TerminologyName
 *              properties:
 *                  TerminologyName:
 *                      type: string
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successful - Successfully deleted the file.
 *          400:
 *              description: InvalidParameterValueException - The value of the parameter is invalid. Review the value of the parameter you are using to correct it, and then retry your operation.
 *          434:
 *              description: ResourceNotFoundException - The resource you are looking for has not been found. Review the resource you're looking for and see if a different resource will accomplish your needs before retrying the revised request.
 *          437:
 *              description: TooManyRequestsException - You have made too many requests within a short period of time. Wait for a short time and then try your request again.
 *          404:
 *              description: Error
 *          500:
 *              description: InternalServerException - An internal server error occurred. Please check the validity of the parameters and retry your request.
 */
app.delete('/api/translate/delete-terminology', cors(corsOptions), (req, res) =>{

    //sanitization and validation
    if(req.body.TerminologyName.length >= 1 && req.body.TerminologyName.length <= 256){
        TerminologyName = req.body.TerminologyName;
    }

    if(TerminologyName){
        var terminologyName = {
            Name: TerminologyName
        }   
    }

    if(terminologyName){
        translate.deleteTerminology(terminologyName, function(err, data){
            if(err){                                    //error occured
                console.log(err, err.stack);
                if(err['code'] == 'InvalidParameterValueException'){
                    res.status(400);
                }else if(err['code'] == 'ResourceNotFoundException'){
                    res.status(434);
                }else if(err['code'] == 'TooManyRequestsException'){
                    res.status(437);
                }else if(err['code'] == 'InternalServerException'){
                    res.status(500);
                }else{
                    res.status(404);
                }
                res.send(err);
            }        
            else{                                       //success
                console.log(data);
                res.status(200);
                res.send('Deleted the Custom Terminology file');
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Server started on ${port}`);
});