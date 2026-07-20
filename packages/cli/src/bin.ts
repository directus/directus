#!/usr/bin/env node
import { registerProfile } from './commands/profile/index.js';
import { run } from './kernel/run.js';

process.exitCode = await run(process.argv.slice(2), { registerCommands: registerProfile });
