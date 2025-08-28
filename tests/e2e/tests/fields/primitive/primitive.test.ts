import { createDirectus, rest, staticToken } from '@directus/sdk';
import { testInteger } from './integer';
import { testString } from './string';
import { useSnapshot } from '../../../utils/useSnapshot';
import { join } from 'path';
import { testBoolean } from './boolean';
import { testDate } from './date';
import { testDateTime } from './date-time';
import { testTimestamp } from './timestamp';
import { testFloat } from './float';
import { testUUID } from './uuid';
import { Schema } from './schema';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

export type Collections = typeof collections;

testInteger(api, collections);
testFloat(api, collections);
testString(api, collections);
testBoolean(api, collections);
testDate(api, collections);
testDateTime(api, collections);
testTimestamp(api, collections);
testUUID(api, collections);
