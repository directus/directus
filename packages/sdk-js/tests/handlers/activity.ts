import { ActivityHandler } from '../../src/handlers/activity';
import { ItemsHandler } from '../../src/handlers/items';
import axios, { AxiosInstance } from 'axios';
import sinon, { SinonSandbox } from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('ActivityHandler', () => {
	let sandbox: SinonSandbox;
	let axiosInstance: AxiosInstance;
	let handler: ActivityHandler;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		axiosInstance = axios.create();
		handler = new ActivityHandler(axiosInstance);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('constructor', () => {
		it('Initializes ItemHandler instance', () => {
			expect(handler['itemsHandler']).to.be.instanceOf(ItemsHandler);
		});
	});

	describe('read', () => {
		it('Calls ItemsHandler#read with the provided params', async () => {
			const stub = sandbox
				.stub(handler['itemsHandler'], 'read')
				.returns(Promise.resolve({ data: {} }));

			await handler.read();
			expect(stub).to.have.been.calledWith();

			await handler.read(15);
			expect(stub).to.have.been.calledWith(15);

			await handler.read([15, 41]);
			expect(stub).to.have.been.calledWith([15, 41]);

			await handler.read([15, 41], { fields: ['title'] });
			expect(stub).to.have.been.calledWith([15, 41], { fields: ['title'] });
		});
	});

	describe('comments.create', () => {
		it('Calls the /activity/comments endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'post')
				.returns(Promise.resolve({ data: {} }));

			await handler.comments.create({
				collection: 'articles',
				item: '15',
				comment: 'Hello World',
			});

			expect(stub).to.have.been.calledWith('/activity/comments', {
				collection: 'articles',
				item: '15',
				comment: 'Hello World',
			});
		});
	});

	describe('comments.update', () => {
		it('Calls the /activity/comments/:id endpoint', async () => {
			const stub = sandbox
				.stub(handler['axios'], 'patch')
				.returns(Promise.resolve({ data: {} }));

			await handler.comments.update(15, { comment: 'Hello Update' });

			expect(stub).to.have.been.calledWith('/activity/comments/15', {
				comment: 'Hello Update',
			});
		});
	});

	describe('comments.delete', () => {
		it('Calls the /activity/comments/:id endpoint', async () => {
			const stub = sandbox.stub(handler['axios'], 'delete').returns(Promise.resolve());

			await handler.comments.delete(15);

			expect(stub).to.have.been.calledWith('/activity/comments/15');
		});
	});
});
