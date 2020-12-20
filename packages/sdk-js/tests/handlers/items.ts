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
		it('Calls the /items/:collection endpoint when creating a single item', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: '' });
			await handler.createOne({ title: 'test' });
			expect(stub).to.have.been.calledWith('/items/test/', { title: 'test' }, { params: undefined });
		});

		it('Calls the /items/:collection endpoint when creating multiple items', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: '' });
			await handler.createMany([{ title: 'test' }, { title: 'another test' }]);
			expect(stub).to.have.been.calledWith('/items/test/', [{ title: 'test' }, { title: 'another test' }], {
				params: undefined,
			});
		});

		it('Passes the query params', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: '' });
			await handler.createOne({ title: 'test' }, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/', { title: 'test' }, { params: { fields: ['test'] } });

			await handler.createMany([{ title: 'test' }, { title: 'another test' }], {
				fields: ['test'],
			});
			expect(stub).to.have.been.calledWith('/items/test/', [{ title: 'test' }, { title: 'another test' }], {
				params: { fields: ['test'] },
			});
		});
	});

	describe('read', () => {
		it('Reads all with no params', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.readMany();
			expect(stub).to.have.been.calledWith('/items/test/', { params: { single: false } });
		});

		it('Does not set the PK when only using query', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.readMany({ fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/', { params: { fields: ['test'], single: false } });
		});

		it('Adds the PK when set', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.readOne(15);
			expect(stub).to.have.been.calledWith('/items/test/15');
		});

		it('Sets both pk and query', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.readOne(15, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/15', {
				params: { fields: ['test'], single: true },
			});
		});
	});

	describe('update', () => {
		it('Updates a single item to a new value', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });
			await handler.updateOne({ test: 'new value' }, 15);
			expect(stub).to.have.been.calledWith('/items/test/15', { test: 'new value' }, { params: undefined });

			await handler.updateOne({ test: 'new value' }, 15, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/15', { test: 'new value' }, { params: { fields: ['test'] } });
		});

		it('Updates multiple items to a new value', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });
			await handler.updateMany({ test: 'new value' }, [15, 42]);
			expect(stub).to.have.been.calledWith('/items/test/15,42', { test: 'new value' }, { params: undefined });

			await handler.updateMany({ test: 'new value' }, [15, 42], { fields: ['test'] });
			expect(stub).to.have.been.calledWith(
				'/items/test/15,42',
				{ test: 'new value' },
				{ params: { fields: ['test'] } }
			);
		});

		it('Allows updating by query', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });

			await handler.updateOne({ archived: true }, { filter: {} });

			expect(stub).to.have.been.calledWith('/items/test/', { archived: true }, { params: { filter: {} } });
		});
	});

	describe('delete', () => {
		it('Deletes a single item', async () => {
			const stub = sandbox.stub(handler['axios'], 'delete').resolves();
			await handler.deleteOne(15);
			expect(stub).to.have.been.calledWith('/items/test/15');
		});

		it('Deletes multiple items', async () => {
			const stub = sandbox.stub(handler['axios'], 'delete').resolves();
			await handler.deleteMany([15, 42]);
			expect(stub).to.have.been.calledWith('/items/test/15,42');
		});
	});
});
