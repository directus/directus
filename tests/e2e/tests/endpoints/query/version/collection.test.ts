import { createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`string _eq`, async () => {});
