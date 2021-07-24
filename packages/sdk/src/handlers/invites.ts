import { ITransport } from '../transport';
import { ID } from '../types';

export class InvitesHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async send(email: string, role: ID, invite_url?: string): Promise<void> {
		await this.transport.post('/users/invite', {
			email,
			role,
			invite_url,
		});
	}

	async accept(token: ID, password: string): Promise<void> {
		await this.transport.post(`/users/invite/accept`, {
			token,
			password,
		});
	}
}
