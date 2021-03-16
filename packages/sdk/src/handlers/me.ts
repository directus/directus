import { PartialItem, QueryOne } from '../items';
import { ITransport } from '../transport';

export class MeHandler<T extends Object> {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async read(query?: QueryOne<T>): Promise<T> {
		const response = await this.transport.get<T>('/users/me', {
			params: query,
		});
		return response.data!;
	}

	async update(data: PartialItem<T>, query?: QueryOne<T>): Promise<T> {
		const response = await this.transport.patch<T>(`/users/me`, data, {
			params: query,
		});
		return response.data!;
	}
}
