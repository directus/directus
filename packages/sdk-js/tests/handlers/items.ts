import { ItemsHandler } from '../../src/handlers/items';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('ItemsHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: ItemsHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new ItemsHandler('test', axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {
		it('Sets the passed collection to this.collection', () => {
			const handler = new ItemsHandler('test', axiosInstance);
			expect(handler['collection']).to.equal('test');
		});
	});

	// describe('specs.oas', () => {
	// 	it('Calls the /server/specs/oas endpoint', async () => {
	// 		const stub = sandbox
	// 			.stub(handler['axios'], 'get')
	// 			.returns(Promise.resolve({ data: '' }));
	// 		await handler.specs.oas();
	// 		expect(stub).to.have.been.calledWith('/server/specs/oas');
	// 	});
	// });
});
