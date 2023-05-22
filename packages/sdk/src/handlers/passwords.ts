import { Transport } from '../transport';

export class PasswordsHandler {
	private transport: Transport;

	constructor(transport: Transport) {
		this.transport = transport;
	}

	async request(email: string, reset_url?: string | null): Promise<void> {
		await this.transport.post('/auth/password/request', { email, reset_url });
	}

	async reset(token: string, password: string): Promise<void> {
		await this.transport.post('/auth/password/reset', { token, password });
	}
}
