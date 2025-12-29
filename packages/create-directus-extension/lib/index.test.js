import { BUNDLE_EXTENSION_TYPES, EXTENSION_LANGUAGES, EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';
import inquirer from 'inquirer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './index.js';

// Mock dependencies
vi.mock('inquirer');
vi.mock('@directus/extensions-sdk/cli');

describe('run function', () => {
	const mockInquirerPrompt = vi.mocked(inquirer.prompt);
	const mockCreate = vi.mocked(create);
	const originalArgv = process.argv;

	beforeEach(() => {
		vi.clearAllMocks();
		process.argv = ['node', 'index.js'];
	});

	afterEach(() => {
		process.argv = originalArgv;
	});

	it('should call inquirer.prompt with correct questions', async () => {
		// Arrange
		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-extension',
			language: 'typescript',
			install: true,
		});

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);

		const calledWith = mockInquirerPrompt.mock.calls[0][0];

		// Check that all required prompts are present
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

	it('should call create with correct parameters for non-bundle extension', async () => {
		// Arrange
		const mockAnswers = {
			type: 'interface',
			name: 'my-interface',
			language: 'typescript',
			install: true,
		};

		mockInquirerPrompt.mockResolvedValue(mockAnswers);

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(mockCreate).toHaveBeenCalledTimes(1);

		expect(mockCreate).toHaveBeenCalledWith(mockAnswers.type, mockAnswers.name, {
			language: mockAnswers.language,
			install: mockAnswers.install,
		});
	});

	it('should call create with correct parameters for bundle extension', async () => {
		// Arrange
		const mockAnswers = {
			type: 'bundle',
			name: 'my-bundle',
			language: undefined,
			install: false,
		};

		mockInquirerPrompt.mockResolvedValue(mockAnswers);

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(mockCreate).toHaveBeenCalledTimes(1);

		expect(mockCreate).toHaveBeenCalledWith(mockAnswers.type, mockAnswers.name, {
			language: undefined,
			install: false,
		});
	});

	it('should test language prompt conditional logic for bundle type', async () => {
		// Arrange
		mockInquirerPrompt.mockResolvedValue({
			type: 'bundle',
			name: 'test-bundle',
			install: true,
		});

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		const calledWith = mockInquirerPrompt.mock.calls[0][0];
		const languagePrompt = calledWith[2]; // Third prompt is the language prompt

		// Test the 'when' function for bundle type (should return false)
		expect(languagePrompt.when({ type: 'bundle' })).toBe(false);
		// Also test that bundle is indeed in BUNDLE_EXTENSION_TYPES
		expect(BUNDLE_EXTENSION_TYPES.includes('bundle')).toBe(true);
	});

	it('should test language prompt conditional logic for non-bundle type', async () => {
		// Arrange
		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-interface',
			language: 'javascript',
			install: true,
		});

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		const calledWith = mockInquirerPrompt.mock.calls[0][0];
		const languagePrompt = calledWith[2]; // Third prompt is the language prompt

		// Test the 'when' function for interface type (should return true)
		expect(languagePrompt.when({ type: 'interface' })).toBe(true);
	});

	it('should handle errors from create function', async () => {
		// Arrange
		const error = new Error('Create failed');

		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-extension',
			language: 'typescript',
			install: true,
		});

		mockCreate.mockRejectedValue(error);

		// Act & Assert
		await expect(run()).rejects.toThrow('Create failed');
	});

	it('should handle errors from inquirer prompt', async () => {
		// Arrange
		const error = new Error('Prompt failed');

		mockInquirerPrompt.mockRejectedValue(error);

		// Act & Assert
		await expect(run()).rejects.toThrow('Prompt failed');
	});

	it('should work with javascript language', async () => {
		// Arrange
		const mockAnswers = {
			type: 'hook',
			name: 'test-hook',
			language: 'javascript',
			install: false,
		};

		mockInquirerPrompt.mockResolvedValue(mockAnswers);

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(mockCreate).toHaveBeenCalledWith('hook', 'test-hook', {
			language: 'javascript',
			install: false,
		});
	});

	it('should work with typescript language', async () => {
		// Arrange
		const mockAnswers = {
			type: 'endpoint',
			name: 'test-endpoint',
			language: 'typescript',
			install: true,
		};

		mockInquirerPrompt.mockResolvedValue(mockAnswers);

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(mockCreate).toHaveBeenCalledWith('endpoint', 'test-endpoint', {
			language: 'typescript',
			install: true,
		});
	});

	it('should work with different extension types', async () => {
		// Test a few key extension types
		const extensionTypes = ['interface', 'display', 'hook', 'endpoint', 'operation'];

		for (const extensionType of extensionTypes) {
			// Reset mocks for each iteration
			vi.clearAllMocks();

			// Arrange
			const mockAnswers = {
				type: extensionType,
				name: `test-${extensionType}`,
				language: 'typescript',
				install: true,
			};

			mockInquirerPrompt.mockResolvedValue(mockAnswers);

			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith(extensionType, `test-${extensionType}`, {
				language: 'typescript',
				install: true,
			});
		}
	});

	it('should display welcome message', async () => {
		// Arrange
		const consoleSpy = vi.spyOn(console, 'log');

		mockInquirerPrompt.mockResolvedValue({
			type: 'interface',
			name: 'test-extension',
			language: 'typescript',
			install: true,
		});

		mockCreate.mockResolvedValue(undefined);

		// Act
		await run();

		// Assert
		expect(consoleSpy).toHaveBeenCalledWith('This utility will walk you through creating a Directus extension.\n');

		// Restore the spy
		consoleSpy.mockRestore();
	});

	describe('non-interactive mode', () => {
		it('should create extension with type and name arguments only', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'interface', 'my-extension'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('interface', 'my-extension', {
				language: 'javascript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should create extension with --language option', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'panel', 'my-panel', '--language', 'typescript'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('panel', 'my-panel', {
				language: 'typescript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should create extension with -l language option', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'hook', 'my-hook', '-l', 'typescript'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('hook', 'my-hook', {
				language: 'typescript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should create extension with --no-install option', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'endpoint', 'my-endpoint', '--no-install'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('endpoint', 'my-endpoint', {
				language: 'javascript',
				install: false,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should create extension with both --language and --no-install options', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'operation', 'my-operation', '--language', 'typescript', '--no-install'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('operation', 'my-operation', {
				language: 'typescript',
				install: false,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should create extension with options in different order', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'display', 'my-display', '--no-install', '-l', 'typescript'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('display', 'my-display', {
				language: 'typescript',
				install: false,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should fall back to interactive mode when only type is provided', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'interface'];

			mockInquirerPrompt.mockResolvedValue({
				type: 'interface',
				name: 'test-extension',
				language: 'typescript',
				install: true,
			});

			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);

			expect(mockCreate).toHaveBeenCalledWith('interface', 'test-extension', {
				language: 'typescript',
				install: true,
			});
		});

		it('should fall back to interactive mode when no arguments provided', async () => {
			// Arrange
			process.argv = ['node', 'index.js'];

			mockInquirerPrompt.mockResolvedValue({
				type: 'panel',
				name: 'test-panel',
				language: 'javascript',
				install: false,
			});

			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);

			expect(mockCreate).toHaveBeenCalledWith('panel', 'test-panel', {
				language: 'javascript',
				install: false,
			});
		});

		it('should fall back to interactive mode when first argument starts with --', async () => {
			// Arrange
			process.argv = ['node', 'index.js', '--language', 'typescript'];

			mockInquirerPrompt.mockResolvedValue({
				type: 'hook',
				name: 'test-hook',
				language: 'typescript',
				install: true,
			});

			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockInquirerPrompt).toHaveBeenCalledTimes(1);
		});

		it('should use javascript as default language when --language option has no value', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'interface', 'my-extension', '--language'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('interface', 'my-extension', {
				language: 'javascript',
				install: true,
			});
		});

		it('should use javascript as default language when -l option has no value', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'hook', 'my-hook', '-l'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('hook', 'my-hook', {
				language: 'javascript',
				install: true,
			});
		});

		it('should handle bundle type in non-interactive mode', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'bundle', 'my-bundle'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('bundle', 'my-bundle', {
				language: 'javascript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should handle bundle type with explicit language in non-interactive mode', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'bundle', 'my-bundle', '--language', 'typescript'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			expect(mockCreate).toHaveBeenCalledWith('bundle', 'my-bundle', {
				language: 'typescript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should handle --language followed by another flag (uses next flag as language value)', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'interface', 'my-extension', '--language', '--no-install'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			// This is the actual behavior - it takes '--no-install' as the language value
			// and still respects --no-install because it's in the args array
			expect(mockCreate).toHaveBeenCalledWith('interface', 'my-extension', {
				language: '--no-install',
				install: false,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should pass through invalid extension type to create function', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'invalid-type', 'my-extension'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			// The CLI doesn't validate - it passes through to create() for validation
			expect(mockCreate).toHaveBeenCalledWith('invalid-type', 'my-extension', {
				language: 'javascript',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});

		it('should pass through invalid language to create function', async () => {
			// Arrange
			process.argv = ['node', 'index.js', 'interface', 'my-extension', '--language', 'invalid-lang'];
			mockCreate.mockResolvedValue(undefined);

			// Act
			await run();

			// Assert
			// The CLI doesn't validate - it passes through to create() for validation
			expect(mockCreate).toHaveBeenCalledWith('interface', 'my-extension', {
				language: 'invalid-lang',
				install: true,
			});

			expect(mockInquirerPrompt).not.toHaveBeenCalled();
		});
	});
});
