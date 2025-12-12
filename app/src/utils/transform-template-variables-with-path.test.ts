import { describe, expect, it } from 'vitest';
import { transformTemplateVariablesWithPath } from './transform-template-variables-with-path';

describe('transformTemplateVariablesWithPath', () => {
	it('should return template unchanged when path is empty', () => {
		const template = '{{name}} {{email}}';
		const result = transformTemplateVariablesWithPath(template, []);
		expect(result).toBe('{{name}} {{email}}');
	});

	it('should prefix single variable with single path segment', () => {
		const template = '{{name}}';
		const result = transformTemplateVariablesWithPath(template, ['user']);
		expect(result).toBe('{{user.name}}');
	});

	it('should prefix multiple variables with single path segment', () => {
		const template = '{{name}} - {{email}}';
		const result = transformTemplateVariablesWithPath(template, ['user']);
		expect(result).toBe('{{user.name}} - {{user.email}}');
	});

	it('should prefix variables with multiple path segments', () => {
		const template = '{{first_name}} {{last_name}}';
		const result = transformTemplateVariablesWithPath(template, ['user', 'profile']);
		expect(result).toBe('{{user.profile.first_name}} {{user.profile.last_name}}');
	});

	it('should handle template with text and variables', () => {
		const template = 'Collection {{name}}';
		const result = transformTemplateVariablesWithPath(template, ['tags_id']);
		expect(result).toBe('Collection {{tags_id.name}}');
	});

	it('should handle complex template with multiple variables and text', () => {
		const template = 'User: {{first_name}} {{last_name}} ({{email}})';
		const result = transformTemplateVariablesWithPath(template, ['author']);
		expect(result).toBe('User: {{author.first_name}} {{author.last_name}} ({{author.email}})');
	});

	it('should not modify non-mustache content', () => {
		const template = 'Plain text without variables';
		const result = transformTemplateVariablesWithPath(template, ['path']);
		expect(result).toBe('Plain text without variables');
	});
});
