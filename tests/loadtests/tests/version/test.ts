import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';

export const options: Options = {
	scenarios: {
		first: {
			duration: '10s',
			executor: 'constant-vus',
			vus: 95,
			exec: 'withoutVersion',
		},
		second: {
			vus: 5,
			executor: 'constant-vus',
			exec: 'withVersion',
			duration: '10s',
		},
	},
};

export function withoutVersion() {
	const res = http.get(`http://${__ENV['HOST']}:${__ENV['PORT']}/items/articles/1?fields=*.*.*`, {
		headers: {
			Authorization: 'Bearer admin',
		},
	});

	check(res, {
		'status is 200': () => res.status === 200,
	});

	sleep(1);
}

export function withVersion() {
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
