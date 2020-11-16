import { AuthHandler } from '../../src/handlers';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox, SinonFakeTimers } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { MemoryStore } from '../../src/utils/memory-store';

chai.use(sinonChai);

const mockResponse = {
	data: {
		access_token: 'abc.def.ghi',
		refresh_token: 'jkl.mno.pqr',
		expires: 900000,
	},
};

Object.freeze(mockResponse);

describe('AuthHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: AuthHandler;
	let clock: SinonFakeTimers;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new AuthHandler(axiosInstance, {
			mode: 'json',
			autoRefresh: false,
			storage: new MemoryStore(),
		});
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		sandbox.restore();
		clock.restore();
	});

	describe('token', () => {
		it('Sets token as auth header in Axios', () => {
			handler.token = 'test';
			expect(handler['axios'].defaults.headers.Authorization).to.equal('Bearer test');
		});

		it('Deletes the defaults auth header to undefined when token is set to a falsey value', () => {
			handler['axios'].defaults.headers.Authorization = 'Bearer test';
			handler.token = null;
			expect(handler['axios'].defaults.headers.Authorization).to.be.undefined;
		});

		it('Gets the token from Axios default header', () => {
			handler['axios'].defaults.headers.Authorization = 'Bearer test';
			expect(handler.token).to.equal('test');
		});

		it('Returns null if headers do not exist, or if token is not set', () => {
			handler['axios'].defaults.headers = null;
			expect(handler.token).to.be.null;

			handler['axios'].defaults.headers = { Authorization: null };
			expect(handler.token).to.be.null;

			handler['axios'].defaults.headers.Authorization = 'Invalid';
			expect(handler.token).to.be.null;
		});

		it('Preserves the other existing default headers', () => {
			handler['axios'].defaults.headers = {
				Test: 'example',
			};

			handler.token = 'Rijk';

			expect(handler['axios'].defaults.headers.Test).to.exist;
		});

		it('Defaults to {} if no default headers exist yet', () => {
			handler['axios'].defaults.headers = null;
			handler.token = 'Rijk';
			expect(handler['axios'].defaults.headers.Authorization).to.exist;
		});
	});

	describe('login', () => {
		it('Calls the /auth/login endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			await handler.login({ email: 'test@example.com', password: 'test' });
			expect(stub).to.have.been.calledWith('/auth/login', {
				email: 'test@example.com',
				password: 'test',
				mode: 'json',
			});
		});

		it('Sets the token after retrieval', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			await handler.login({ email: 'test@example.com', password: 'test' });
			expect(handler['token']).to.equal('abc.def.ghi');
		});

		it('Adds the refresh token to the passed store in JSON mode', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			const testStore = new MemoryStore();
			const stub = sandbox.stub(testStore, 'setItem');

			handler['storage'] = testStore;

			handler['mode'] = 'json';
			await handler.login({ email: 'test@example.com', password: 'test' });
			expect(stub).to.have.been.calledWith('directus_refresh_token', 'jkl.mno.pqr');
		});

		it('Does not attempt to set the refresh token in cookie mode', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			const testStore = new MemoryStore();
			const stub = sandbox.stub(testStore, 'setItem');

			handler['mode'] = 'cookie';
			await handler.login({ email: 'test@example.com', password: 'test' });
			expect(stub).to.not.have.been.called;
		});

		it('Calls refresh 10 seconds before expiry time when in autoRefresh mode', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler['autoRefresh'] = true;
			const stub = sandbox.stub(handler, 'refresh').resolves();
			await handler.login({ email: 'test@example.com', password: 'test' });

			clock.tick(885000); // 15 seconds before expiry time
			expect(stub).to.not.have.been.called;
			clock.tick(6000); // add +6s
			expect(stub).to.have.been.called;
		});

		it('Does not call refresh when not in auto refresh mode', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler['autoRefresh'] = false;
			const stub = sandbox.stub(handler, 'refresh').resolves();
			await handler.login({ email: 'test@example.com', password: 'test' });

			clock.tick(910000);
			expect(stub).to.not.have.been.called;
		});
	});

	describe('refresh', () => {
		it('Calls the /auth/refresh endpoint without refresh token when in cookie mode', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler['mode'] = 'cookie';
			await handler.refresh();
			expect(stub).to.have.been.calledWith('/auth/refresh', { mode: 'cookie' });
		});

		it('Passes the refresh token from the store when using JSON mode', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler['mode'] = 'json';
			const testStore = new MemoryStore();
			testStore['values'].directus_refresh_token = 'test-token';
			handler['storage'] = testStore;
			await handler.refresh();
			expect(stub).to.have.been.calledWith('/auth/refresh', {
				mode: 'json',
				refresh_token: 'test-token',
			});
		});

		it('Sets the token on refresh', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler.token = 'before';
			await handler.refresh();
			expect(handler.token).to.equal('abc.def.ghi');
		});

		it('Adds the refresh token to the passed store in JSON mode', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			const testStore = new MemoryStore();
			const stub = sandbox.stub(testStore, 'setItem');

			handler['storage'] = testStore;

			handler['mode'] = 'json';
			await handler.refresh();
			expect(stub).to.have.been.calledWith('directus_refresh_token', 'jkl.mno.pqr');
		});

		it('Calls itself 10 seconds before expiry when autoRefresh is enabled', async () => {
			sandbox.stub(handler['axios'], 'post').resolves({ data: mockResponse });
			handler['autoRefresh'] = true;
			const spy = sandbox.spy(handler, 'refresh');
			await handler.refresh();
			clock.tick(910000);

			expect(spy).to.have.been.calledTwice;
		});
	});

	describe('logout', () => {
		it('Calls the /auth/logout endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves();
			await handler.logout();
			expect(stub).to.have.been.calledWith('/auth/logout');
		});

		it('Nullifies the token', async () => {
			sandbox.stub(handler['axios'], 'post').resolves();
			handler.token = 'test-token';
			await handler.logout();
			expect(handler.token).to.be.null;
		});
	});

	describe('password.request', () => {
		it('Calls the /auth/password/request endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves();
			await handler.password.request('admin@example.com');
			expect(stub).to.have.been.calledWith('/auth/password/request', {
				email: 'admin@example.com',
			});
		});
	});

	describe('password.reset', () => {
		it('Calls the /auth/password/reset endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves();
			await handler.password.reset('abc.def.ghi', 'p455w0rd');
			expect(stub).to.have.been.calledWith('/auth/password/reset', {
				token: 'abc.def.ghi',
				password: 'p455w0rd',
			});
		});
	});
});
