
describe('Socket Client', function(){
	beforeEach(function(){
		var self = this;
		this.onSpy = this.sinon.spy();
		this.socket = this.sinon.stub();
		this.socket.returns({on:this.onSpy});
		this.debounce = this.sinon.stub();
		this.system.set(this.system.normalizeSync('socket.io-client'), this.system.newModule({default: this.socket}));
		this.system.set(this.system.normalizeSync('lib/debounce.js'), this.system.newModule({default: this.debounce}));
		return this.system.import('lib/socket-client.js').then(function(Client){
			self.Client = Client.default;
		}).catch(console.log);
	});
	it('Should open a new socket connection when created', function(){
		var client = new this.Client('testUrl', null, null)
		expect(this.socket.getCall(0).args[0]).to.equal('testUrl');
	})
	it('Should initialize a change handler when created', function(){
		var createMock = this.sinon.stub();
		createMock.returns('test');
		this.Client.prototype._createHandler = createMock;
		var client = new this.Client('testUrl', 'changeHandler', 1000);
		expect(createMock.getCall(0).args[0]).to.equal(1000);
		expect(this.onSpy.getCall(0).args).deep.to.equal(['change', 'test']);
	})
	it('Should single queue the changehandler', function(){
		var changeHandler = this.sinon.stub();
		changeHandler.returns(q.delay(100));
		var createMock = this.sinon.stub();
		this.Client.prototype._createHandler = createMock;

		var client = new this.Client('testUrl', changeHandler, 50);
		client._onChangeResolve('1');
		client._onChangeResolve('2'); // Will start queue
		client._onChangeResolve('3'); // Will overwrite queue
		return expect(q.delay(400).then(function(){
			expect(changeHandler.getCall(0).args[0]).to.deep.equal(['1'])
			expect(changeHandler.getCall(1).args[0]).to.deep.equal(['2','3'])

			client._onChangeResolve('4');
			client._onChangeResolve('5'); // Will start queue
			client._onChangeResolve('6'); // Will overwrite queue
			return q.delay(400);
		}).then(function(){
			expect(changeHandler.getCall(2).args[0]).to.deep.equal(['4'])
			expect(changeHandler.getCall(3).args[0]).to.deep.equal(['5','6'])
			return changeHandler.callCount;
		})).to.eventually.equal(4);
	})
})