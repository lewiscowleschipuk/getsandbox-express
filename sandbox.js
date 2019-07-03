var path = require('path');
var fs = require('fs');
var vm = require('vm');
var requireLike = require('require-like');
var morgan = require('morgan');
var attachLiquidTemplateEngine = require('./attach-liquid-template-engine');
var bodyParser = require('body-parser');

var app;
var Sandbox = {};
var warnedAboutMethods = {};

Sandbox.define = function define() {
  var url, verb, handler;
  if (arguments.length === 2) {
    url = arguments[0];
    verb = 'get';
    handler = arguments[1];
  } else if (arguments.length === 3) {
    url = arguments[0];
    verb = arguments[1];
    handler = arguments[2];
  }
  verb = verb.toLowerCase();
  url = url.replace(/{(.+?)}/g, ":$1");
  url = encodeURI(url);

  if (typeof app[verb] === 'function') {
    app[verb](url, handler);
  } else {
      if (!warnedAboutMethods[verb]) {
          console.warn("Ignoring registration of '" + verb.toUpperCase() + "' http method, because it's not implemented in Express.js.");
          warnedAboutMethods[verb] = true;
      }
  }
};

var loadSandbox = function loadSandbox(expressApp, sandboxMainPath) {
  if (!path.isAbsolute(sandboxMainPath)) {
    throw new Error('sandbox main path must be absolute path');
  }
  app = expressApp;
  app.use(morgan('dev'));
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));

  var sandboxDir = path.dirname(sandboxMainPath);
  attachLiquidTemplateEngine(app, sandboxDir);

  var sandbox = {};
  sandbox.require = requireLike(sandboxMainPath);
  sandbox.Sandbox = Sandbox;
  sandbox.state = {};
  sandbox.moment = require('moment-timezone');
  sandbox._ = require('lodash');
  sandbox.faker = require('faker');
  sandbox.amanda = require('amanda');
  sandbox.validator = require('validator');

  var script = new vm.Script(fs.readFileSync(sandboxMainPath).toString(), {filename: sandboxMainPath});
  script.runInNewContext(sandbox);
};

module.exports = {
  loadSandbox: loadSandbox
};
