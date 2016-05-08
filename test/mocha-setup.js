module.exports = setup;

function setup(global){
	// If this is a node test, SystemJs won't be set up, so initialize it
	if(!global.System) {
		global.System = eval("require('systemjs')");
		require(process.cwd() + '/' + require(process.cwd() + '/package.json').jspm.configFile);
	}
	
	// Return a promise for tests to be chained off of.
	return createRunner();

	function createRunner(){
		// Import all of the libraries used for testing, and then load them into the
		// global namespace for tests to consume.
		return System.import('q').then(function(q){
			global.q = q;
			return q.all([
			    System.import('chai'),
			    System.import('sinon'),
			    System.import('sinon-chai'),
			    System.import('chai-as-promised'),
			    System.import('core-js')
			]).spread(initGlobals);
		}).catch(function(ex){
		    console.error('Error Setting Up Test Loader:')
		    console.error(ex)
		    throw ex;
		});
	}

	function initGlobals(chai, sinon, sinonChai, chaiAsPromised){
	    // Wait for mocha phantomjs to load if this is a browser test
	    if(global.initMochaPhantomJS)
	      global.initMochaPhantomJS();
		 // Set up mocks
	    chai.use(sinonChai);
	    // Set up promise framework
	    chai.use(chaiAsPromised);
	    // Make should syntax available
	    chai.should();
	    // Make expect available
	    global.expect = chai.expect;
	    // Make assert available
	    global.assert = chai.assert;
	    if(global.mocha)
		    // Initialize mocha
		    global.mocha.setup('bdd');
		// sinon (mocking framework) cleanup hooks
	    beforeEach(function() {
	    	this.sinon = sinon.sandbox.create();
	    	this.system = new System.constructor();
	    	this.system.baseURL = System.baseURL
			this.system.transpiler = System.transpiler
			this.system.defaultJSExtensions = System.defaultJSExtensions;
			this.system.map = System.map
			this.system.paths = System.paths;
			this.test.parent.title = global.document ? "Web:" : "Node:"
	    });
	    afterEach(function(){
	      this.sinon.restore();
	    });
	}
}



