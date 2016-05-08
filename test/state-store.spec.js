import StateStore from 'lib/state-store.js'
describe('StateStore', function(){
	beforeEach(function(){
		this.stateStore = new StateStore();
	})
	it('should store and return values', function(){
		var spy = this.sinon.spy();
		this.stateStore.unload({__unload:this.sinon.stub().returns('test')}, 'name');
		this.stateStore.reload({__reload:spy}, 'name');
		expect(spy.getCall(0).args[0]).to.equal('test');
	})
})