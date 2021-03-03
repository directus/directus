import { Auth } from '../core/auth';
import Base, { DirectusOptions } from '../core/directus';
import { AxiosTransport } from '../core/transport/axios';

export class Directus extends Base {
	constructor(url: string, options?: Partial<DirectusOptions>) {
		const transport = options?.transport || new AxiosTransport(url);
		const auth = options?.auth || new Auth(transport);

		super({
			auth,
			transport,
		});
	}
}

export default Directus;
