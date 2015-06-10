// Uncomment the line below to automatically translate this module, which is written in ES6, into ES5 on the fly.
// **NOTE** This will run ALL node modules through Babel.js and should not be used in production.  You should preprocess
// these files yourself in whatever build process you use.
require('babel/register');
module.exports = require('machine').pack({
    pkg: require('./package.json'),
    dir: __dirname
});
