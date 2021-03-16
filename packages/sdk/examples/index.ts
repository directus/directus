import { Auth, AxiosTransport, Directus, MemoryStorage } from '../src';

async function main() {
	const url = 'http://directus';

	const storage = new MemoryStorage();
	const transport = new AxiosTransport(url, storage);
	const auth = new Auth(transport, storage, {
		mode: 'json',
	});

	const sdk = new Directus(url, {
		auth,
		storage,
		transport,
	});

	await sdk.auth.login({
		email: 'admin@example.com',
		password: 'password',
	});

	const me = await sdk.users.me.read();
	console.log(`Welcome ${me.name}!`);
}
