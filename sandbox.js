var path = require('path');
var fs = require('fs');
var vm = require('vm');
var morgan = require('morgan');
var attachLiquidTemplateEngine = require('./attach-liquid-template-engine');
var bodyParser = require('body-parser');
var dirname = require('path').dirname;
var timers = require('timers');

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

var loadSandbox = function loadSandbox(expressApp, sandboxMainPath, options) {
  if (!path.isAbsolute(sandboxMainPath)) {
    throw new Error('sandbox main path must be absolute path');
  }

  options = options || {};

  app = expressApp;
  app.use(morgan('dev'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  var sandboxDir = path.dirname(sandboxMainPath);
  attachLiquidTemplateEngine(app, sandboxDir);

  var sandbox = {};
  // this require function is only for relative files, it passes the sandbox content (3rd party libs etc. to the required modules)
  sandbox.require = (file, requiringFile) => {
    if (!file.match(/\.js$/)) file += '.js';

    var pathToSource = path.resolve(dirname(requiringFile || sandboxMainPath), file);

    var script = new vm.Script(fs.readFileSync(pathToSource).toString().replace(/require\(([^\)]+)/g, 'require($1, \'' + pathToSource + '\''), { filename: file });
    var requireContext = {
      ...sandbox,
      exports: {}
    };
    script.runInNewContext(requireContext);

    return requireContext.exports;
  };
  sandbox.Sandbox = Sandbox;
  sandbox.state = {};
  sandbox.moment = require('moment-timezone');
  sandbox._ = require('lodash');
  sandbox.faker = require('faker');
  sandbox.amanda = require('amanda');
  sandbox.validator = require('validator');
  sandbox.console = console;

  if (options.persistState === true) {
    const statefile = dirname(sandboxMainPath) + '/state.json';
    // on init restore the state from statefile if it exists
    if (fs.existsSync(statefile)) {
        try {
            sandbox.state = JSON.parse(fs.readFileSync(statefile, 'utf8'));
            console.info('Restored state from ' + statefile);
        } catch(e) {
            sandbox.state = {};
            console.warn('Could not restore state ' + e);
        }
    }

    // periodically save state
    timers.setInterval(() => {
        fs.writeFileSync(statefile, JSON.stringify(sandbox.state));
    }, 1000);
  }

  var script = new vm.Script(fs.readFileSync(sandboxMainPath).toString(), { filename: sandboxMainPath });
  script.runInNewContext(sandbox);
};

module.exports = {
  loadSandbox: loadSandbox
};
