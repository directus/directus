#!/usr/bin/env node
import { commands } from './commands/index.js';
import { run } from './kernel/run.js';

process.exitCode = await run(process.argv.slice(2), { commands });
