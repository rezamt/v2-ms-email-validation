'use strict'

const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');

const apiKey = 'YOUR-KEY';
const targetURL = 'https://api.experianmarketingservices.com/sync/queryresult/EmailValidate/1.0/';

const connectionTimeout = 5;
const verbose = true;

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
    }
    ;

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

const success = (resp) => {
    console.log(resp);
}

const failed = (err) => {
    console.log(err);
}

const handleError = (err) => {
    if (err instanceof ServiceError) {
        console.log('ServiceError: ', JSON.stringify(err));

        return({code: err.status, message: err.message});

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

        if (err.code === 'ECONNREFUSED') return {code : 504, message : 'Connection Refused'};
        else if (err.code === 'ENOTFOUND') return {code: 500, message:  'Server Error'};
        else return {code: 500, message: err.message}
    }
}

const validateResponse = (res) => {
    if (!res.ok) {
        console.log('Request failed due to the following Error: ', res.headers.get('message'));
        throw new ServiceError(res.headers.get('message'), res.status, res.statusText, res.headers);
    }
}

// @todo: AWS Incoming Event
const handler = () => {

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
        success(mappingEmailVerificationResponse(JSON.parse(body)));
    }).catch((err) => {
       failed(handleError(err));
    });
}

handler();