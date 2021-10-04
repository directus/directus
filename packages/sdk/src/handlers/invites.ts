import { ITransport } from '@/src/transport.js';
import { ID } from '@/src/types.js';

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
