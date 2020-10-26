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
		it('Sets the correct endpoint', () => {
			const handler = new ItemsHandler('test', axiosInstance);
			expect(handler['endpoint']).to.equal('/items/test/');

			const handler2 = new ItemsHandler('directus_activity', axiosInstance);
			expect(handler2['endpoint']).to.equal('/activity/');
		});
	});

	describe('create', () => {
		it('Calls the /items/:collection endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));
			await handler.create({});
			expect(stub).to.have.been.calledWith('/items/test/');
		});

		it('Passes the payload(s)', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));

			await handler.create({ title: 'new item' });
			expect(stub).to.have.been.calledWith('/items/test/', { title: 'new item' });

			await handler.create([{ title: 'new item' }, { title: 'another new item' }]);
			expect(stub).to.have.been.calledWith('/items/test/', [
				{ title: 'new item' },
				{ title: 'another new item' },
			]);
		});

		it('Adds the optional query', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: '' }));

			await handler.create({});
			expect(stub).to.have.been.calledWith('/items/test/', {});

			await handler.create({}, { fields: ['title'] });
			expect(stub).to.have.been.calledWith(
				'/items/test/',
				{},
				{ params: { fields: ['title'] } }
			);
		});
	});
});
