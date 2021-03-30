import { ITransport } from '../transport';

export class PasswordsHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async request(email: string): Promise<void> {
		await this.transport.post('/auth/password/request', { email });
	}

	async reset(token: string, password: string, reset_url?: string | null): Promise<void> {
		await this.transport.post('/auth/password/reset', { token, password, reset_url });
	}
}
