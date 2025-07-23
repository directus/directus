import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';

export const options: Options = {
	scenarios: {
		first: {
			vus: 100,
			duration: '5m',
			executor: 'constant-vus',
			exec: 'dev',
		},
		second: {
			vus: 100,
			duration: '5m',
			executor: 'constant-vus',
			exec: 'dev2',
		},
	},
};

export function dev() {
	const res = http.get(`http://${__ENV['HOST']}:${__ENV['PORT']}/items/articles/1?fields=*.*.*&version=dev`, {
		headers: {
			Authorization: 'Bearer admin',
		},
	});

	check(res, {
		'status is 200': () => res.status === 200,
	});

	sleep(1);
}

export function dev2() {
	const res = http.get(`http://${__ENV['HOST']}:${__ENV['PORT']}/items/articles/1?fields=*.*.*&version=dev2`, {
		headers: {
			Authorization: 'Bearer admin',
		},
	});

	check(res, {
		'status is 200': () => res.status === 200,
	});

	sleep(1);
}
