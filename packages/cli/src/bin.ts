#!/usr/bin/env node
import { run } from './kernel/run.js';
import { corePlugins } from './plugins/index.js';

process.exitCode = await run(process.argv.slice(2), { plugins: corePlugins });
