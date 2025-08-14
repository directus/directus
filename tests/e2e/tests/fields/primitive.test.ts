import { createDirectus, rest, staticToken } from '@directus/sdk';
import { testInteger } from './primitive/integer';
import { testString } from './primitive/string';
import { useSnapshot } from '../../utils/use-snapshot';
import { join } from 'path';
import { testBoolean } from './primitive/boolean';
import { testDate } from './primitive/date';
import { testDateTime } from './primitive/date-time';
import { testTimestamp } from './primitive/timestamp';
import { testFloat } from './primitive/float';
import { testUUID } from './primitive/uuid';

export type Schema = {
	fields: {
		id: any;
		big_integer: any;
		boolean: any;
		date: any;
		date_time: any;
		decimal: any;
		float: any;
		integer: any;
		string: any;
		text: any;
		time: any;
		timestamp: any;
		uuid: any;
	};
};

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
await useSnapshot(api, join(import.meta.dirname, 'primitive.snapshot.json'));

testInteger(api);
testFloat(api);
testString(api);
testBoolean(api);
testDate(api);
testDateTime(api);
testTimestamp(api);
testUUID(api);
