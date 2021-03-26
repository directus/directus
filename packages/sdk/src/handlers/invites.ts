import { ITransport } from '../transport';
import { ID } from '../types';

export class InvitesHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async send(email: string, role: ID): Promise<void> {
		await this.transport.post('/users/invite', {
			email,
			role,
		});
	}

	async accept(token: ID, password: string): Promise<void> {
		await this.transport.patch(`/users/invite/accept`, {
			token,
			password,
		});
	}
}
