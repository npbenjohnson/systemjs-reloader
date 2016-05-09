import StateStore from 'lib/state-store.js'
describe('StateStore', function(){
	it('should not store and return values', function(){
		this.stateStore = new StateStore();
		var spy = this.sinon.spy();
		this.stateStore.unload({__unload:this.sinon.stub().returns('test')}, 'name');
		this.stateStore.reload({__reload:spy}, 'name');
		expect(spy.getCall(0).args).to.deep.equal([]);
	})
	it('should store and return values', function(){
		this.stateStore = new StateStore(true);
		var spy = this.sinon.spy();
		this.stateStore.unload({__unload:this.sinon.stub().returns('test')}, 'name');
		this.stateStore.reload({__reload:spy}, 'name');
		expect(spy.getCall(0).args[0]).to.equal('test');
	})
})