'use strict'

const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const constants = require('./constants');
// const targetURL = 'https://api.experianmarketingservices.com/sync/queryresult/EmailValidate/1.0/';

const apiKey = process.env.AUTH_TOKEN || '';
const targetURL = process.env.SERVICE_URL || 'https://api.experianmarketingservices.com/sync/queryresult/EmailValidate/1.0/';
const connectionTimeout = process.env.CONNECTION_TIMEOUT || 5;
const verbose = process.env.VERBOSE || true;

/* Sample Generic payload
   Ref: https://www.edq.com/documentation/apis/email-validate/email-validate-api/#postman-collections
{
    "Email": "pax",
    "Certainty": "undeliverable",
    "Message": "OK",
    "VerboseOutput": "syntaxFailure",
    "Corrections": ["Anemailexample@gmail.com"]
}
*/

class ServiceError extends Error {
    constructor(message, status, statusText, headers) {
        super(message);
        this.type = 'service';
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
    }
}

const mappingEmailVerificationResponse = (body) => {

    let response = '';
    let result = '';
    let errorCode = '';

    switch (body.VerboseOutput) {
        case 'verified':
        case 'roleAccount':
            result = 'Valid';
            break;
        case 'mailboxDisabled':
        case 'mailboxFull':
            result = 'Invalid';
            errorCode = body.VerboseOutput;
            break;
        case 'syntaxFailure':
        case 'mailboxDoesNotExist':
        case 'typoDomain':
        case 'localPartSpamTrap':
        case 'undeliverable':
        case 'unreachable':
        case 'unresolvable':
        case 'illegitimate':
        case 'disposable':
        case 'unknown':
        case 'timeout':
        case 'acceptAll':
        case 'relayDenied':
            result = 'Invalid';
            errorCode = 'invalid';
            break;
        default:
            console.log('Response VerboseOutput didn\'t match defaults: ', resp.VerboseOutput);
            result = 'Invalid';
            errorCode = 'invalid';
    }


    if (result === 'Valid') {
        response = {result: result};
    } else {
        response = {
            result: result,
            errorCode: errorCode
        }

        body.Corrections ? response.corrections = body.Corrections : '';
    }

    return response;
}

const success = (res, callback) => callback(null, {
    statusCode: constants.HTTP_SUCCESS,
    body: JSON.stringify(transformResponse(res)),
    headers: constants.DEFAULT_HEADERS
}

const failed = (err, callback) => callback(null, {
    statusCode: err.code,
    body: JSON.stringify({status: 'error', code: err.code, meessage: err.message}),
    headers: constants.DEFAULT_HEADERS
});


const handleError = (err) => {
    if (err instanceof ServiceError) {
        console.log('ServiceError: ', JSON.stringify(err));

        return ({code: err.status, message: err.message});
    } else {
        console.log('Error ', JSON.stringify({
            name: err.name,
            type: err.type,
            errno: err.errno,
            code: err.code,
            message: err.message
        }));
        // ENOTFOUND : Server Not Found - DNS Error
        // ECONNREFUSED: Connection Refused

        if (err.code === 'ECONNREFUSED') return {code: constants.HTTP_CONN_REFUSED, message: 'Connection Refused'};
        else if (err.code === 'ENOTFOUND') return {code: constants.HTTP_SERVER_ERROR, message: 'Invalid Target Server'};
        else return {code: constants.HTTP_SERVER_ERROR, message: 'Internal Server Error'}
    }
}

const validateResponse = (res) => {
    if (!res.ok) {
        console.log('Request failed due to the following Error: ' + res.headers.get(constants.HTTP_HEADER_MESSAGE) + ' QueryID: ' + res.headers.get(constants.HTTP_HEADER_QUERYID));
        throw new ServiceError(res.headers.get('message'), res.status, res.statusText, res.headers);
    }
}

// @todo: AWS Incoming Event
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const UUID = uuidv1();

    // @todo: Read Email from incoming message
    const email1 = 'rezamt@gmail.com';
    const email2 = 'Anemailexample@gmail.co';
    const email = 'r';

    const verificationPayload = {
        "Email": email,
        "Timeout": connectionTimeout,
        "Verbose": verbose
    };


    const req = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Auth-Token': apiKey,
            'x-transaction-id': UUID
        },
        body: JSON.stringify(verificationPayload)
    };

    fetch(targetURL, req).then((res) => {
        validateResponse(res);
        return (res.text());
    }).then((body) => {
        console.log(`Response Recieved: `, body);

        const mappedResponse = mappingEmailVerificationResponse(JSON.parse(body));
        console.log(`Response Transformed to : `, mappedResponse);

        success(mappedResponsem, callback);
    }).catch((err) => {

        failed(handleError(err), callback);
    });
}