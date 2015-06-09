// This is a boilerplate file which should not need to be changed.
require('babel/register');
module.exports = require('machine').pack({
    pkg: require('./package.json'),
    dir: __dirname
});
