import { sleep, check } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';

export const options: Options = {
	scenarios: {
		first: {
			duration: '5m',
			executor: 'constant-vus',
			vus: 100,
			exec: 'items',
		},
	},
};

export function items() {
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
