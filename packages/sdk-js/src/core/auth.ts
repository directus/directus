import { AuthData, AuthResult, IAuth } from '../shared/auth';
import { ITransport } from '../shared/transport';

export class Auth implements IAuth {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async authenticate(_data: AuthData): Promise<AuthResult> {
		const response = await this.transport.post('/auth/login', {});
		return {
			access_token: response.data.access_token,
			refresh_token: response.data.refresh_token,
			expires: response.data.expires,
		};
	}
}
