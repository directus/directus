#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';

if (/\.(js|mjs|ts|json|vue|scss|css|md|yaml|yml)$/.test(file)) {
	spawnSync('pnpm', ['exec', 'prettier', '--write', file], {
		cwd: process.env.CLAUDE_PROJECT_DIR,
		stdio: 'inherit',
		shell: true,
	});
}
