import { FoldersHandler, ItemsHandler } from '../../src/handlers';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('FoldersHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: FoldersHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new FoldersHandler(axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {
		it('Initializes ItemHandler instance', () => {
			expect(handler['itemsHandler']).to.be.instanceOf(ItemsHandler);
		});
	});

	describe('create', () => {
		it('Calls ItemsHandler#create with the provided params', async () => {
			const stub = sandbox
				.stub(handler['itemsHandler'], 'create')
				.returns(Promise.resolve({ data: {} }));

			await handler.create({ folder: 'test' });
			expect(stub).to.have.been.calledWith({ folder: 'test' });

			await handler.create([{ folder: 'test' }]);
			expect(stub).to.have.been.calledWith([{ folder: 'test' }]);

			await handler.create({ folder: 'test' }, { fields: ['id'] });
			expect(stub).to.have.been.calledWith({ folder: 'test' }, { fields: ['id'] });
		});
	});

	describe('read', () => {
		it('Calls ItemsHandler#read with the provided params', async () => {
			const stub = sandbox
				.stub(handler['itemsHandler'], 'read')
				.returns(Promise.resolve({ data: {} }));

			await handler.read();
			expect(stub).to.have.been.calledWith();
		});
	});

	describe('update', () => {
		it('Calls ItemsHandler#update with the provided params', async () => {
			const stub = sandbox
				.stub(handler['itemsHandler'], 'update')
				.returns(Promise.resolve({ data: [{}] }));

			await handler.update(15, { folder: 'updated name' });
			expect(stub).to.have.been.calledWith(15, { folder: 'updated name' });
		});
	});

	describe('delete', () => {
		it('Calls ItemsHandler#delete with the provided params', async () => {
			const stub = sandbox.stub(handler['itemsHandler'], 'delete').returns(Promise.resolve());

			await handler.delete(15);
			expect(stub).to.have.been.calledWith(15);
		});
	});
});
