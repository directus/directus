import { ITransport } from '../../../src/shared/transport';

export function createTransportTests(createTransport: () => ITransport) {
	return function () {
		it('get should make get requests', async function () {
			const transport = createTransport();
			await transport.get('/get');
		});
	};
}
