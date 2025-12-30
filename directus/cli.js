#!/usr/bin/env node
import { version } from './version.js';
import { updateCheck } from '@directus/update-check';

if (version) {
	await updateCheck(version);
}

import('@directus/api/cli/run.js');
