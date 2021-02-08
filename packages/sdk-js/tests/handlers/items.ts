import { ItemsHandler } from '../../src/handlers/items';
import { createAxiosInstance } from '../../src/utils/create-axios';
import { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import nock from 'nock';

chai.use(sinonChai);

describe('ItemsHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: ItemsHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = createAxiosInstance();
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
			await handler.create({ title: 'test' });
			expect(stub).to.have.been.calledWith('/items/test/', { title: 'test' }, { params: undefined });
		});

		it('Calls the /items/:collection endpoint when creating multiple items', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: '' });
			await handler.create([{ title: 'test' }, { title: 'another test' }]);
			expect(stub).to.have.been.calledWith('/items/test/', [{ title: 'test' }, { title: 'another test' }], {
				params: undefined,
			});
		});

		it('Passes the query params', async () => {
			const stub = sandbox.stub(handler['axios'], 'post').resolves({ data: '' });
			await handler.create({ title: 'test' }, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/', { title: 'test' }, { params: { fields: ['test'] } });

			await handler.create([{ title: 'test' }, { title: 'another test' }], {
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
			await handler.read();
			expect(stub).to.have.been.calledWith('/items/test/', { params: {} });
		});

		it('Does not set the PK when only using query', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.read({ fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/', { params: { fields: ['test'] } });
		});

		it('Adds the PK when set', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.read(15);
			expect(stub).to.have.been.calledWith('/items/test/15');
		});

		it('Sets both pk and query', async () => {
			const stub = sandbox.stub(handler['axios'], 'get').resolves({ data: '' });
			await handler.read(15, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/15', {
				params: { fields: ['test'] },
			});
		});

		it('Returns {errors} with 400 bad request', async () => {
			const mockErrors = { errors: [{ message: 'MOCK_ERROR' }] };
			nock('http://localhost').get('/items/test/1').reply(400, mockErrors);
			let err = null;
			try {
				await handler.read(1);
			} catch (error) {
				err = error;
			}
			expect(err).to.eql(mockErrors.errors);
		});
	});

	describe('update', () => {
		it('Updates a single item to a new value', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });
			await handler.update(15, { test: 'new value' });
			expect(stub).to.have.been.calledWith('/items/test/15', { test: 'new value' }, { params: undefined });

			await handler.update(15, { test: 'new value' }, { fields: ['test'] });
			expect(stub).to.have.been.calledWith('/items/test/15', { test: 'new value' }, { params: { fields: ['test'] } });
		});

		it('Updates multiple items to a new value', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });
			await handler.update([15, 42], { test: 'new value' });
			expect(stub).to.have.been.calledWith('/items/test/15,42', { test: 'new value' }, { params: undefined });

			await handler.update([15, 42], { test: 'new value' }, { fields: ['test'] });
			expect(stub).to.have.been.calledWith(
				'/items/test/15,42',
				{ test: 'new value' },
				{ params: { fields: ['test'] } }
			);
		});

		it('Allows updating by query', async () => {
			const stub = sandbox.stub(handler['axios'], 'patch').resolves({ data: '' });

			await handler.update({ archived: true }, { filter: {} });

			expect(stub).to.have.been.calledWith('/items/test/', { archived: true }, { params: { filter: {} } });
		});
	});

	describe('delete', () => {
		it('Deletes a single item', async () => {
			const stub = sandbox.stub(handler['axios'], 'delete').resolves();
			await handler.delete(15);
			expect(stub).to.have.been.calledWith('/items/test/15');
		});

		it('Deletes multiple items', async () => {
			const stub = sandbox.stub(handler['axios'], 'delete').resolves();
			await handler.delete([15, 42]);
			expect(stub).to.have.been.calledWith('/items/test/15,42');
		});
	});
});
