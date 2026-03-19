#!/usr/bin/env nodeimport { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';

if (/\.(js|mjs|ts|vue)$/.test(file)) {
	spawnSync('pnpm', ['exec', 'eslint', '--fix', file], {
		cwd: process.env.CLAUDE_PROJECT_DIR,
		stdio: 'inherit',
		shell: true,
	});
}
