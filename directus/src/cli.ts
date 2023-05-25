#!/usr/bin/env node
import { updateNotifier } from './update-notifier.js';

await updateNotifier();
import('@directus/api/cli/run.js');
