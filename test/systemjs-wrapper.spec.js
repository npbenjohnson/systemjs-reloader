describe('Wrapper', function(){
	beforeEach(function(){
		var self = this;
		// Must use new instance to import everything because prototypical inheritance across instances can't be matched
		//this.system = new System.constructor()
		this.socket = this.sinon.stub();
		this.base = this.system.normalizeSync('').replace(/\.js$/,'');
		return this.system.import('lib/systemjs-wrapper.js').then(function(Wrapper){
			self.wrapped = new Wrapper.default(self.system);
			// fake this because system loading already happened
			self.wrapped.initialLoads = System.loads;
		});
	})
	it('should trace newly loaded modules', function(){
		var self = this;
		return expect(this.system.import('test/fakes/fakemodule.js').then( function(module){
			return Object.keys(self.wrapped.moduleEntries).length;
		})).to.eventually.equal(1);
	})
	it('should not trace state store', function(){
		var self = this;
		return expect(this.system.import('lib/state-store.js').then( function(module){
			return Object.keys(self.wrapped.moduleEntries).length;
		})).to.eventually.equal(0);
	})
	it('should normalize js module', function(){
		return expect(this.wrapped.fileNormalize('test.js')).to.eventually.equal(this.base + 'test.js');
	})
	it('should normalize non-js module with loader', function(){
		return expect(this.wrapped.fileNormalize('test.html')).to.eventually.equal(this.base + 'test.html!' + this.base + 'html.js');
	})
	it('should delete loads on delete', function(){
		var self = this;
		return expect(this.system.import('test/fakes/fakemodule.js').then( function(module){
			self.system['delete'](self.base + 'test/fakes/fakemodule.js');
			return Object.keys(self.wrapped.moduleEntries).length; 
		})).to.eventually.equal(0);
	})
	it('should map dynamic parents', function(){
		var self = this;
		return expect(this.system.import('test/fakes/fakemodule.js', this.base).then( function(module){
			return self.wrapped.getDynamicParents(self.system.normalizeSync('test/fakes/fakemodule.js'))[0]; 
		})).to.eventually.equal(this.base);
	})
	it('should call reload on reloaded modules', function(){
		var self = this;
		self.wrapped.stateStore = {reload: this.sinon.spy()};
		return expect(this.system.import('test/fakes/fakemodule.js').then(function(module){
			return self.wrapped.stateStore.calledOnce;
		})).to.eventually.equal.true;
	})
})