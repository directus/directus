import { createDirectus, rest, staticToken } from '@directus/sdk';
import { testInteger } from './primitive/integer';
import { testString } from './primitive/string';
import { useSnapshot } from '../../utils/use-snapshot';
import { join } from 'path';

export type Schema = {
	fields: {
		id: number;
		big_integer: string;
		boolean: boolean;
		date: string;
		date_time: string;
		decimal: number;
		float: number;
		integer: string | number;
		string: string;
		text: string;
		time: string;
		timestamp: string;
		uuid: string;
	};
};

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
await useSnapshot(api, join(import.meta.dirname, 'primitive.snapshot.json'));

testInteger(api);
testString(api);
