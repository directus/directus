import { UtilsHandler } from '../../src/handlers/utils';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('UtilsHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: UtilsHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new UtilsHandler(axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('random.string', () => {
		it('Calls the /utils/random/string endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'get')
				.returns(Promise.resolve({ data: '' }));
			await handler.random.string();
			expect(stub).to.have.been.calledWith('/utils/random/string', {
				params: { length: 32 },
			});
		});

		it('Passes the parameter to the length query param', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'get')
				.returns(Promise.resolve({ data: '' }));
			await handler.random.string(15);
			expect(stub).to.have.been.calledWith('/utils/random/string', {
				params: { length: 15 },
			});
		});
	});

	describe('hash.generate', () => {
		it('Calls the /utils/hash/generate endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.hash.generate('test');
			expect(stub).to.have.been.calledWith('/utils/hash/generate');
		});

		it('Passes the parameter as string in body', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.hash.generate('test');
			expect(stub).to.have.been.calledWith('/utils/hash/generate', { string: 'test' });
		});
	});

	describe('hash.verify', () => {
		it('Calls the /utils/hash/verify endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.hash.verify('test', '$argonHash');
			expect(stub).to.have.been.calledWith('/utils/hash/verify');
		});

		it('Passes the parameters as string, hash in body', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.hash.verify('test', '$argonHash');
			expect(stub).to.have.been.calledWith('/utils/hash/verify', {
				string: 'test',
				hash: '$argonHash',
			});
		});
	});

	describe('sort', () => {
		it('Calls the /utils/sort/:collection endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.sort('articles', 10, 15);
			expect(stub).to.have.been.calledWith('/utils/sort/articles', { item: 10, to: 15 });
		});
	});

	describe('revert', () => {
		it('Calls the /utils/revert/:revision endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.revert(25);
			expect(stub).to.have.been.calledWith('/utils/revert/25');
		});
	});
});
