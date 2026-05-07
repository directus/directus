import { beforeEach, describe, expect, it } from 'vitest';
import { resolveFieldName } from './resolve-field-name';
import { i18n } from '@/lang';

describe('resolveFieldName', () => {
	beforeEach(() => {
		i18n.global.locale.value = 'en-US';
	});

	it('formats the field key when no name or translations are provided', () => {
		expect(resolveFieldName({ field: 'title' }, 'en-US')).toBe('Title');
		expect(resolveFieldName({ field: 'created_at' }, 'en-US')).toBe('Created At');
	});

	it('uses the provided name when no translations are configured', () => {
		expect(resolveFieldName({ field: 'title', name: 'Custom Label' }, 'en-US')).toBe('Custom Label');
	});

	it('returns the matching meta.translations entry for the active locale', () => {
		const field = {
			field: 'title',
			name: 'Fallback',
			meta: {
				translations: [
					{ language: 'en-US', translation: 'Title (EN)' },
					{ language: 'de-DE', translation: 'Titel (DE)' },
				],
			},
		};

		expect(resolveFieldName(field, 'en-US')).toBe('Title (EN)');
		expect(resolveFieldName(field, 'de-DE')).toBe('Titel (DE)');
	});

	it('falls back to the provided name when no translation matches the active locale', () => {
		const field = {
			field: 'title',
			name: 'Fallback',
			meta: {
				translations: [{ language: 'en-US', translation: 'Title (EN)' }],
			},
		};

		expect(resolveFieldName(field, 'fr-FR')).toBe('Fallback');
	});

	it('falls back when the matched translation is empty', () => {
		const field = {
			field: 'title',
			name: 'Fallback',
			meta: {
				translations: [{ language: 'en-US', translation: '' }],
			},
		};

		expect(resolveFieldName(field, 'en-US')).toBe('Fallback');
	});

	it('falls back to the formatted field key when name is missing entirely', () => {
		const field = {
			field: 'created_at',
			meta: {
				translations: [{ language: 'fr-FR', translation: 'Créé le' }],
			},
		};

		expect(resolveFieldName(field, 'en-US')).toBe('Created At');
		expect(resolveFieldName(field, 'fr-FR')).toBe('Créé le');
	});

	it('resolves a $t: prefixed name through vue-i18n', () => {
		i18n.global.mergeLocaleMessage('en-US', { custom: { sub_label: 'Resolved Label' } });

		expect(resolveFieldName({ field: 'title', name: '$t:custom.sub_label' }, 'en-US')).toBe('Resolved Label');
	});

	it('prefers meta.translations over a $t: prefixed name', () => {
		const field = {
			field: 'title',
			name: '$t:custom.sub_label',
			meta: {
				translations: [{ language: 'en-US', translation: 'From translations' }],
			},
		};

		i18n.global.mergeLocaleMessage('en-US', { custom: { sub_label: 'Resolved Label' } });

		expect(resolveFieldName(field, 'en-US')).toBe('From translations');
	});
});
