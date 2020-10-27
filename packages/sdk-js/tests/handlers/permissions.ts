import { PermissionsHandler, ItemsHandler } from '../../src/handlers';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('PermissionsHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: PermissionsHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new PermissionsHandler(axiosInstance);
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

			await handler.create({ permissions: 'test' });
			expect(stub).to.have.been.calledWith({ permissions: 'test' });

			await handler.create([{ permissions: 'test' }]);
			expect(stub).to.have.been.calledWith([{ permissions: 'test' }]);

			await handler.create({ permissions: 'test' }, { fields: ['id'] });
			expect(stub).to.have.been.calledWith({ permissions: 'test' }, { fields: ['id'] });
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

			await handler.update(15, { permissions: 'updated name' });
			expect(stub).to.have.been.calledWith(15, { permissions: 'updated name' });
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
