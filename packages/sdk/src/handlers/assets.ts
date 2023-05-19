import { EmptyParamError } from '../items';
import { ITransport } from '../transport';
import { ID } from '../types';

export class AssetsHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(id: ID): Promise<any> {
		if (`${id}` === '') throw new EmptyParamError('id');

		const response = await this.transport.get(`/assets/${id}`, {
			responseType: 'stream',
		});

		return response.raw;
	}
}
