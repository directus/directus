import { sandbox } from '@directus/sandbox';
import { authentication, createDirectus, rest } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { Signal } from '@utils/signal.js';
import { afterAll, expect, test } from 'vitest';

const directus = await sandbox(database, {
	inspect: false,
	prefix: 'redact',
	port: sandboxPort(),
	env: {
		LOG_LEVEL: 'debug',
		LOG_STYLE: 'raw',
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: { suffix: getUID() },
});

const url = `http://localhost:${directus.apis[0]!.port}`;

const messages = new Signal<string[]>([]);

directus.logger.onLog((msg) => {
	messages.set([...messages.get(), msg]);
});

afterAll(async () => {
	await directus.stop();
});

/** Waits for the log line of a request to `path` and returns it. */
function logFor(path: string) {
	const seen = messages.get().length;

	return (predicate: (line: string) => boolean = () => true) =>
		messages.waitFor((all) => all.slice(seen).find((msg) => msg.includes(path) && predicate(msg)));
}

const credentials = { email: directus.env.ADMIN_EMAIL!, password: directus.env.ADMIN_PASSWORD! };

async function post(path: string, body: Record<string, unknown>, cookie?: string) {
	const response = await fetch(`${url}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
		body: JSON.stringify(body),
	});

	return { response, body: (await response.json().catch(() => ({}))) as any };
}

function cookieHeader(response: Response) {
	return response.headers
		.getSetCookie()
		.map((entry) => entry.split(';')[0])
		.join('; ');
}

test('redact sensitive data', async () => {
	const api = createDirectus(url).with(rest()).with(authentication());

	await api.login(credentials);

	const loginMsg = await messages.waitFor((msgs) => msgs.find((msg) => msg.includes('/auth/login')));
	const loginData = JSON.parse(loginMsg ?? '{}');

	expect(loginData.res.headers['set-cookie']).toBe('--redacted--');
});

test('a json refresh logs no cookies at all, because none were exchanged', async () => {
	// Asked for explicitly, so the tokens travel in the payload rather than in a cookie
	const { body: login } = await post('/auth/login', { ...credentials, mode: 'json' });

	expect(login.data.refresh_token).toEqual(expect.any(String));

	const next = logFor('/auth/refresh');

	const { response } = await post('/auth/refresh', { refresh_token: login.data.refresh_token, mode: 'json' });

	expect(response.status).toBe(200);

	const log = (await next())!;

	expect(log).not.toContain('"cookie":"--redacted--"');
	expect(log).not.toContain('"set-cookie":"--redacted--"');
});

for (const mode of ['cookie', 'session'] as const) {
	test(`a ${mode} refresh redacts the cookie it received and the one it sets`, async () => {
		const { response: loginResponse } = await post('/auth/login', { ...credentials, mode });

		const cookie = cookieHeader(loginResponse);

		const next = logFor('/auth/refresh');

		const { response } = await post('/auth/refresh', { mode }, cookie);

		expect(response.status).toBe(200);

		const log = (await next((line) => line.includes('set-cookie')))!;

		expect(log).toContain('"cookie":"--redacted--"');
		expect(log).toContain('"set-cookie":"--redacted--"');
	});
}
