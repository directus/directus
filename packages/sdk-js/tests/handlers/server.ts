import { ServerHandler } from '../../src/handlers/server';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('ServerHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: ServerHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new ServerHandler(axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('specs.oas', () => {
		it('Calls the /server/specs/oas endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'get')
				.returns(Promise.resolve({ data: '' }));
			await handler.specs.oas();
			expect(stub).to.have.been.calledWith('/server/specs/oas');
		});
	});

	describe('ping', () => {
		it('Calls the /server/ping endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').returns(Promise.resolve('pong'));
			await handler.ping();
			expect(stub).to.have.been.calledWith('/server/ping');
		});
	});

	describe('info', () => {
		it('Calls the /server/info endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'get')
				.returns(Promise.resolve({ data: '' }));
			await handler.info();
			expect(stub).to.have.been.calledWith('/server/info');
		});
	});
});
