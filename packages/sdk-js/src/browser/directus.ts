import { Auth } from '../base/auth';
import { Directus, DirectusOptions } from '../base/directus';
import { AxiosTransport } from '../base/transport/axios-transport';

export class Browser extends Directus {
	constructor(url: string, options?: Partial<DirectusOptions>) {
		const transport = options?.transport || new AxiosTransport(url);
		const auth = options?.auth || new Auth(transport);

		super({
			auth,
			transport,
		});
	}
}
