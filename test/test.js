var path = require('path');
var spawn = require('child_process').spawnSync;
var setup = require('./mocha-setup.js');
// Get Reporter argument so that if phantom is called we can output the same output format
var runnerArgs = getRunnerArgs();
setup(global).then(function(){ 
  // Run the web tests specified in testrunner.html (blocking)
  phantom('test/testrunner.html');
  return q.all([
    System.import('test/util.spec.js'),
    System.import('test/state-store.spec.js'),
    System.import('test/systemjs-wrapper.spec.js'),
    System.import('test/socket-client.spec.js'),
    System.import('test/reloader.spec.js')
  ]).then(run).catch(function(){console.log(error);run();});
});

function phantom(htmlFile) {
  // Run the specified file as a mocha-phantom test, its output will be piped into this test's output
    spawn(path.resolve('node_modules/.bin/mocha-phantomjs' + (process.platform.match(/^win/) ? '.cmd' : '')), runnerArgs.concat([htmlFile]), { stdio: 'inherit', stderr: 'pipe' });
}

function getRunnerArgs() {
    var argv = process.argv;
    var runner = process.argv.indexOf('-R') + 1 || process.argv.indexOf('--runner') + 1;
    if (runner !== 0)
        return [process.argv[runner - 1], process.argv[runner]];
    return [];
}
