import { ITransport } from '../transport';

export class PasswordsHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async request(email: string, reset_url?: string | null): Promise<void> {
		await this.transport.post('/auth/password/request', { email, reset_url });
	}

	async reset(token: string, password: string): Promise<void> {
		await this.transport.post('/auth/password/reset', { token, password });
	}
}
