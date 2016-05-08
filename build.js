var Builder = require('systemjs-builder')

// optional constructor options
// sets the baseURL and loads the configuration file
var builder = new Builder('.', './test/systemjs-config.js');

builder
.buildStatic('lib/reloader.js', 'index.static.js', { minify: true, sourceMaps: true, mangle: false })
.then(function() {
  console.log('Build complete');
})
.catch(function(err) {
  console.log('Build error');
  process.exit(1);
});