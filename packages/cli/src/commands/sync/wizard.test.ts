import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isCancel, select } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfigStore } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { pull } from './pull.js';
import { push } from './push.js';
import { wizard } from './wizard.js';

vi.mock('@clack/prompts', () => ({
	select: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('./pull.js', () => ({ pull: vi.fn() }));
vi.mock('./push.js', () => ({ push: vi.fn() }));

function ctxAt(cwd: string, interactive: boolean): CliContext {
	return { cwd, config: createConfigStore(cwd), interactive, ui: createUi({ json: false, color: false }) };
}

describe('sync wizard', () => {
	let dir: string;
	let order: string[];

	function writeConfig(config: Record<string, unknown>): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify(config));
	}

	function twoProfiles(extra: Record<string, unknown> = {}): void {
		writeConfig({
			profiles: {
				staging: { url: 'https://staging.example.com' },
				prod: { url: 'https://prod.example.com' },
			},
			...extra,
		});
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-wizard-'));
		order = [];

		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

		vi.mocked(isCancel).mockReset().mockReturnValue(false);
		vi.mocked(select).mockReset();

		vi.mocked(pull)
			.mockReset()
			.mockImplementation(async () => {
				order.push('pull');
			});

		vi.mocked(push)
			.mockReset()
			.mockImplementation(async () => {
				order.push('push');
			});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
	});

	it('refuses in a non-interactive context, pointing at the subcommands', async () => {
		const error = await wizard(ctxAt(dir, false)).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('USAGE');
		expect((error as CliError).message).toMatch(/needs a terminal/i);
		expect((error as CliError).hint).toMatch(/sync pull/i);
	});

	it('refuses with a CONFIG error when fewer than two profiles are defined', async () => {
		writeConfig({ profiles: { staging: { url: 'https://staging.example.com' } } });

		const error = await wizard(ctxAt(dir, true)).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('CONFIG');
		expect((error as CliError).message).toMatch(/two profiles/i);
	});

	it('runs pull then push with the gathered options when config answers neither project nor mode', async () => {
		twoProfiles();

		vi.mocked(select).mockResolvedValueOnce('staging').mockResolvedValueOnce('prod').mockResolvedValueOnce('merge');

		await wizard(ctxAt(dir, true));

		expect(vi.mocked(pull).mock.calls[0]?.[0]).toEqual({ from: 'staging', project: 'default', deps: true });

		expect(vi.mocked(push).mock.calls[0]?.[0]).toEqual({ to: 'prod', project: 'default', mode: 'merge' });

		expect(order).toEqual(['pull', 'push']);

		expect(select).toHaveBeenCalledTimes(3);

		const messages = vi.mocked(select).mock.calls.map((call) => call[0].message);
		expect(messages).not.toContain('Project scope:');

		const saved = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(saved.projects).toEqual({ default: { mode: 'merge' } });
	});

	it('skips the mode prompt and omits mode from push when the project config sets it', async () => {
		twoProfiles({ projects: { default: { mode: 'mirror' } } });

		vi.mocked(select).mockResolvedValueOnce('staging').mockResolvedValueOnce('prod');

		await wizard(ctxAt(dir, true));

		expect(select).toHaveBeenCalledTimes(2);
		expect(vi.mocked(push).mock.calls[0]?.[0]).toEqual({ to: 'prod', project: 'default' });

		const saved = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(saved.projects).toEqual({ default: { mode: 'mirror' } });
	});

	it('excludes the chosen source from the target options so one profile can never be both ends', async () => {
		twoProfiles();

		vi.mocked(select).mockResolvedValueOnce('staging').mockResolvedValueOnce('prod').mockResolvedValueOnce('merge');

		await wizard(ctxAt(dir, true));

		const targetOptions = (vi.mocked(select).mock.calls[1]?.[0].options ?? []) as { value: string; label: string }[];
		expect(targetOptions.map((option) => option.value)).toEqual(['prod']);
	});
});
