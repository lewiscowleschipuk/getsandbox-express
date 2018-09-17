#!/usr/bin/env node

var express = require('express');
var loadSandbox = require('./sandbox').loadSandbox;

var sandboxMainJs = process.argv[2];
if (!sandboxMainJs) {
    console.error('First command line argument must be the main.js of your sandbox.');
    process.exit(1);
}
var port = process.env.PORT || process.argv[3] || 8080;

var app = express();
loadSandbox(app, sandboxMainJs);
app.listen(port, function () {
    console.log('Listening on http://localhost:' + port);
});