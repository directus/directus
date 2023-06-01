#!/usr/bin/env node
import { updateCheck } from '@directus/update-check';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { version } = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

if (version) {
	await updateCheck(version);
}

import('@directus/api/cli/run.js');
