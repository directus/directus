import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';

export const options: Options = {
	scenarios: {
		first: {
			duration: '5m',
			executor: 'constant-arrival-rate',
			preAllocatedVUs: 1000,
			rate: 10,
			exec: 'withoutVersion',
		},
		second: {
			executor: 'constant-arrival-rate',
			exec: 'withVersion',
			preAllocatedVUs: 100,
			rate: 5,
			duration: '5m',
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
