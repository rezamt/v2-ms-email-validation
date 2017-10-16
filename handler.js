'use strict';

var emailVerification = require('./email-verification');

exports.handler = (event, context, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));

  emailVerification.handler(event, context, callback);

}