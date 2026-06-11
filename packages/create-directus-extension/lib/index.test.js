import { BUNDLE_EXTENSION_TYPES, EXTENSION_LANGUAGES, EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';
import inquirer from 'inquirer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './index.js';

vi.mock('inquirer');
vi.mock('@directus/extensions-sdk/cli');

describe('run', () => {
	const mockInquirerPrompt = vi.mocked(inquirer.prompt);
	const mockCreate = vi.mocked(create);
	const runCli = (args = []) => run(['node', 'create-directus-extension', ...args]);
	let consoleLogSpy;

	beforeEach(() => {
		vi.clearAllMocks();
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		mockCreate.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should call inquirer.prompt with correct questions when no arguments are provided', async () => {
		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-extension',
			language: 'typescript',
			install: true,
		});

		await runCli();

		expect(consoleLogSpy).toHaveBeenCalledWith('This utility will walk you through creating a Directus extension.\n');
		expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);

		const calledWith = mockInquirerPrompt.mock.calls[0][0];

		expect(calledWith).toHaveLength(4);

		expect(calledWith[0]).toMatchObject({
			type: 'list',
			name: 'type',
			message: 'Choose the extension type',
			choices: EXTENSION_TYPES,
		});

		expect(calledWith[1]).toMatchObject({
			type: 'input',
			name: 'name',
			message: 'Choose a name for the extension',
		});

		expect(calledWith[2]).toMatchObject({
			type: 'list',
			name: 'language',
			message: 'Choose the language to use',
			choices: EXTENSION_LANGUAGES,
		});

		expect(calledWith[3]).toMatchObject({
			type: 'confirm',
			name: 'install',
			message: 'Auto install dependencies?',
			default: true,
		});
	});

	it('should pass interactive answers to create', async () => {
		const mockAnswers = {
			type: 'interface',
			name: 'my-interface',
			language: 'typescript',
			install: true,
		};

		mockInquirerPrompt.mockResolvedValue(mockAnswers);

		await runCli();

		expect(mockCreate).toHaveBeenCalledTimes(1);

		expect(mockCreate).toHaveBeenCalledWith('interface', 'my-interface', {
			language: 'typescript',
			install: true,
		});
	});

	it('should use provided partial options as prompt defaults', async () => {
		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'prompted-interface',
			language: 'typescript',
			install: false,
		});

		await runCli(['--type', 'interface', '--language', 'typescript', '--no-install']);

		const calledWith = mockInquirerPrompt.mock.calls[0][0];

		expect(calledWith[0]).toMatchObject({ default: 'interface' });
		expect(calledWith[1]).toMatchObject({ default: undefined });
		expect(calledWith[2]).toMatchObject({ default: 'typescript' });
		expect(calledWith[3]).toMatchObject({ default: false });

		expect(mockCreate).toHaveBeenCalledWith('interface', 'prompted-interface', {
			language: 'typescript',
			install: false,
		});
	});

	it('should create from positional arguments without prompting', async () => {
		await runCli(['interface', 'my-interface']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('interface', 'my-interface', {
			language: 'javascript',
			install: true,
		});
	});

	it('should create from long options without prompting', async () => {
		await runCli(['--type', 'hook', '--name', 'my-hook', '--language', 'typescript']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('hook', 'my-hook', {
			language: 'typescript',
			install: true,
		});
	});

	it('should create from short options without prompting', async () => {
		await runCli(['-l', 'typescript', '-n', 'my-display', '-t', 'display']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('display', 'my-display', {
			language: 'typescript',
			install: true,
		});
	});

	it('should let options override positional arguments', async () => {
		await runCli(['interface', 'positional-name', '--type', 'hook', '--name', 'flag-name']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('hook', 'flag-name', {
			language: 'javascript',
			install: true,
		});
	});

	it('should treat a positional argument as the name when the type is provided via option', async () => {
		await runCli(['hello', '-t', 'bundle']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('bundle', 'hello', {
			language: undefined,
			install: true,
		});
	});

	it('should treat a positional argument as the type when the name is provided via option', async () => {
		await runCli(['panel', '-n', 'hello']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('panel', 'hello', {
			language: 'javascript',
			install: true,
		});
	});

	it('should pass install false when --no-install is used', async () => {
		await runCli(['interface', 'my-interface', '--no-install']);

		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('interface', 'my-interface', {
			language: 'javascript',
			install: false,
		});
	});

	it('should omit language for bundle extensions in non-interactive mode', async () => {
		await runCli(['bundle', 'my-bundle', '--language', 'typescript']);

		expect(BUNDLE_EXTENSION_TYPES.includes('bundle')).toBe(true);
		expect(mockInquirerPrompt).not.toHaveBeenCalled();

		expect(mockCreate).toHaveBeenCalledWith('bundle', 'my-bundle', {
			language: undefined,
			install: true,
		});
	});

	it('should test language prompt conditional logic', async () => {
		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-interface',
			language: 'javascript',
			install: true,
		});

		await runCli();

		const calledWith = mockInquirerPrompt.mock.calls[0][0];
		const languagePrompt = calledWith[2];

		expect(languagePrompt.when({ type: 'bundle' })).toBe(false);
		expect(languagePrompt.when({ type: 'interface' })).toBe(true);
	});

	it('should handle errors from create function', async () => {
		const error = new Error('Create failed');

		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-extension',
			language: 'typescript',
			install: true,
		});

		mockCreate.mockRejectedValue(error);

		await expect(runCli()).rejects.toThrow('Create failed');
	});

	it('should handle errors from inquirer prompt', async () => {
		const error = new Error('Prompt failed');

		mockInquirerPrompt.mockRejectedValue(error);

		await expect(runCli()).rejects.toThrow('Prompt failed');
	});
});
