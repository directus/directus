import { AuthHandler } from '../../src/handlers';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('AuthHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: AuthHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new AuthHandler(axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('password.request', () => {
		it('Calls the /auth/password/request endpoint', async () => {
			const stub = sandbox.stub(handler.axios, 'post').resolves();
			await handler.password.request('admin@example.com');
			expect(stub).to.have.been.calledWith('/auth/password/request', {
				email: 'admin@example.com',
			});
		});
	});

	describe('password.reset', () => {
		it('Calls the /auth/password/reset endpoint', async () => {
			const stub = sandbox.stub(handler.axios, 'post').resolves();
			await handler.password.reset('abc.def.ghi', 'p455w0rd');
			expect(stub).to.have.been.calledWith('/auth/password/reset', {
				token: 'abc.def.ghi',
				password: 'p455w0rd',
			});
		});
	});
});
