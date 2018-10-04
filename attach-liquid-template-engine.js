var Liquid = require('liquidjs');

/**
 * Mutates Express.js `app`, adding handler for Liquid templates.
 */
function attachLiquidTemplateEngine(app, sandboxDir) {
    var engine = Liquid({
        root: sandboxDir, // for layouts and partials
        extname: '.liquid'
    });
    app.engine('liquid', engine.express()); // register liquid engine
    app.set('views', ['./templates']); // specify the views directory
    app.set('view engine', 'liquid'); // set to default
    return app;
}

module.exports = attachLiquidTemplateEngine;