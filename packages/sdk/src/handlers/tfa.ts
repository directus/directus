import { Transport } from '../transport';
import { DefaultType, TfaType } from '../types';

type TfaItem<T = DefaultType> = TfaType & T;
export class TFAHandler {
	private transport: Transport;

	constructor(transport: Transport) {
		this.transport = transport;
	}

	async generate(password: string): Promise<TfaItem> {
		const result = await this.transport.post('/users/me/tfa/generate', { password });
		return result.data;
	}

	async enable(secret: string, otp: string): Promise<void> {
		await this.transport.post('/users/me/tfa/enable', { secret, otp });
	}

	async disable(otp: string): Promise<void> {
		await this.transport.post('/users/me/tfa/disable', { otp });
	}
}
