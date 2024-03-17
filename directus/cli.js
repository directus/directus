#!/usr/bin/env node
import { updateCheck } from '@directus/update-check';
import { version } from './version.js';

if (version && process.env.UPDATE_CHECK_DISABLE !== 'true') {
	await updateCheck(version);
}

import('@directus/api/cli/run.js');
