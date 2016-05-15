
describe('Reloader', function(){
	beforeEach(function(){
		var self = this;
		this.socket = this.sinon.stub();
		this.system.set(this.system.normalizeSync('lib/socket-client.js'), this.system.newModule({default: this.socket}));
		return this.system.import('lib/reloader.js').then(function(Reloader){
			self.reloader = new Reloader.default(self.system);
			// fake this because system loading already happened
			self.system.initialLoads = System.loads;
		});
	})
	it('should calculate an importer map for static and dynamic loads', function(){
		var self = this;
		var dynamicFakeParentName = this.system.normalizeSync('');
		var fakeModuleName = this.system.normalizeSync('test/fakes/fakemodule.js');
		var fakeModuleWithDepsName = this.system.normalizeSync('test/fakes/fakemodule-with-dep.js');
		return expect(this.system.import('test/fakes/fakemodule-with-dep.js').then(function(){
			return self.system.import('test/fakes/fakemodule.js', dynamicFakeParentName)
		}).then(function(){
			var importerMap = self.reloader._createImporterMap();
			expect(importerMap.get(self.reloader.system.loads[fakeModuleName])).to.deep.equal([dynamicFakeParentName, fakeModuleWithDepsName]);
			expect(importerMap.get(self.reloader.system.loads[fakeModuleWithDepsName])).to.deep.equal([]);
		}).catch(function(err){console.log(err.stack);throw err;})).to.be.fulfilled;
	})
	it('should call unload on deleted modules', function(){
		var self = this;
		var spy = this.sinon.spy();
		this.reloader._stateStore = {unload:spy};
		return expect(this.system.import('test/fakes/fakemodule.js').then(function(){
			return self.reloader._reload([self.system.normalizeSync('test/fakes/fakemodule.js')])
		}).then(function(){
			return spy.calledOnce;
		})).to.eventually.equal(true);
	})
	it('should delete importers on delete', function(){
		var self = this;
		var fakeModuleName = this.system.normalizeSync('test/fakes/fakemodule.js');
		var fakeModuleWithDepsName = this.system.normalizeSync('test/fakes/fakemodule-with-dep.js');
		var fakeMap = new WeakMap();
		fakeMap[fakeModuleWithDepsName] = [fakeModuleName];
		return expect(this.system.import('test/fakes/fakemodule-with-dep.js').then(function(){
			var entry = self.reloader._wrapper.moduleEntries[fakeModuleWithDepsName];
			fakeMap.set(entry, [fakeModuleName])
			expect(Object.keys(self.reloader._wrapper.moduleEntries).length).to.equal(2)
			self.reloader._deleteModuleEntry(entry, fakeMap)
			return Object.keys(self.reloader._wrapper.moduleEntries).length;
		})).to.eventually.equal(0);
	})
})