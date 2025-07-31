import { BUNDLE_EXTENSION_TYPES, EXTENSION_LANGUAGES, EXTENSION_TYPES } from '@directus/extensions';
import { create } from '@directus/extensions-sdk/cli';
import inquirer from 'inquirer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from './index.js';

// Mock dependencies
vi.mock('inquirer');
vi.mock('@directus/extensions-sdk/cli');

describe('run function', () => {
	const mockInquirerPrompt = vi.mocked(inquirer.prompt);
	const mockCreate = vi.mocked(create);

	beforeEach(() => {
		vi.clearAllMocks();
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
});
