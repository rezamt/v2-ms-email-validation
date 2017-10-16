module.exports = {
    HTTP_SUCCESS: 200,
    HTTP_SERVER_ERROR: 500,
    HTTP_CONN_REFUSED: 504,

    HTTP_HEADER_QUERYID : 'QueryId',
    HTTP_HEADER_TRANS:    'x-transaction-id',
    HTTP_HEADER_MESSAGE:  'message',

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'access-control-allow-methods': 'OPTIONS, POST',
        'access-control-allow-origin': '*'
    }
};
