import { ITransport } from '../transport';

export class TFAHandler {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async enable(password: string): Promise<void> {
		await this.transport.post('/users/me/tfa/enable', { password });
	}

	async disable(otp: string): Promise<void> {
		await this.transport.post('/users/me/tfa/disable', { otp });
	}
}
