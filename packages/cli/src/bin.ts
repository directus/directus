#!/usr/bin/env node
import { registerProfile } from './commands/profile/profile.js';
import { registerSync } from './commands/sync/sync.js';
import { run } from './kernel/run.js';

process.exitCode = await run(process.argv.slice(2), { registerCommands: [registerProfile, registerSync] });
