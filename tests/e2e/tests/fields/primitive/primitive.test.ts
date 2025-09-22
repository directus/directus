import { createDirectus, rest, staticToken } from '@directus/sdk';
import { testInteger } from './integer.js';
import { testString } from './string.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { join } from 'path';
import { testBoolean } from './boolean.js';
import { testDate } from './date.js';
import { testDateTime } from './date-time.js';
import { testTimestamp } from './timestamp.js';
import { testFloat } from './float.js';
import { testUUID } from './uuid.js';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

export type Collections = typeof collections;
export type Api = typeof api;

testInteger(api, collections);
testFloat(api, collections);
testString(api, collections);
testBoolean(api, collections);
testDate(api, collections);
testDateTime(api, collections);
testTimestamp(api, collections);
testUUID(api, collections);
