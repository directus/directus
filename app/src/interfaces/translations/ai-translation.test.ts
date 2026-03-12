import { describe, expect, test, vi } from 'vitest';
import {
	buildAiTranslationDraft,
	buildAiTranslationPrompt,
	getAiTranslationFieldBehavior,
	isAiTranslateAvailable,
	normalizeAiTranslatedFields,
	resolveTranslationTargetPermission,
} from './ai-translation';

describe('isAiTranslateAvailable', () => {
	test('requires AI enabled, providers, models, and an editable interface', () => {
		expect(
			isAiTranslateAvailable({
				aiEnabled: true,
				availableProviderCount: 1,
				availableModelCount: 1,
			}),
		).toBe(true);

		expect(
			isAiTranslateAvailable({
				aiEnabled: false,
				availableProviderCount: 1,
				availableModelCount: 1,
			}),
		).toBe(false);

		expect(
			isAiTranslateAvailable({
				aiEnabled: true,
				availableProviderCount: 1,
				availableModelCount: 0,
			}),
		).toBe(false);

		expect(
			isAiTranslateAvailable({
				aiEnabled: true,
				availableProviderCount: 1,
				availableModelCount: 1,
				nonEditable: true,
			}),
		).toBe(false);
	});
});

describe('buildAiTranslationDraft', () => {
	test('merges translated fields into the current edit draft instead of the rendered row', () => {
		const existingItem = {
			id: 1,
			title: 'Hello',
			status: 'published',
			languages_code: { code: 'fr' },
		} as any;

		const getItemEdits = vi.fn(() => ({
			$type: 'updated',
			$index: 0,
			slug: 'custom-slug',
		}));

		expect(buildAiTranslationDraft(existingItem, getItemEdits, { title: 'Bonjour' })).toEqual({
			$type: 'updated',
			$index: 0,
			slug: 'custom-slug',
			title: 'Bonjour',
		});

		expect(getItemEdits).toHaveBeenCalledWith(existingItem);
	});
});

describe('getAiTranslationFieldBehavior', () => {
	test('derives translation behavior from field metadata', () => {
		expect(
			getAiTranslationFieldBehavior({
				field: 'slug',
				type: 'string',
				meta: { options: { slug: true } },
			} as any),
		).toBe('slug-safe');

		expect(
			getAiTranslationFieldBehavior({
				field: 'body',
				type: 'text',
				meta: { interface: 'input-rich-text-md' },
			} as any),
		).toBe('markdown');

		expect(
			getAiTranslationFieldBehavior({
				field: 'content',
				type: 'text',
				meta: { interface: 'input-rich-text-html' },
			} as any),
		).toBe('html');

		expect(
			getAiTranslationFieldBehavior({
				field: 'title',
				type: 'string',
				meta: { interface: 'input' },
			} as any),
		).toBe('plain-text');
	});
});

describe('buildAiTranslationPrompt', () => {
	test('builds field-specific instructions from metadata', () => {
		const prompt = buildAiTranslationPrompt({
			sourceLangName: 'English',
			targetLangNames: ['Spanish'],
			sourceContent: {
				title: 'Essential tips for home buyers',
				slug: 'essential-tips-for-home-buyers',
				body: '# Heading\n\nText',
			},
			fields: [
				{ field: 'title', type: 'string', meta: { interface: 'input' } },
				{ field: 'slug', type: 'string', meta: { options: { slug: true } } },
				{ field: 'body', type: 'text', meta: { interface: 'input-rich-text-md' } },
			] as any,
			styleGuide: 'Use an approachable tone.',
			glossary: [{ term: 'Directus', translation_note: 'Keep as-is' }],
		});

		expect(prompt).toContain('## Style Guide');
		expect(prompt).toContain('## Glossary');
		expect(prompt).toContain('"slug": Generate a localized URL slug');
		expect(prompt).toContain('"body": Preserve markdown syntax and structure exactly.');
		expect(prompt).toContain('"title": Translate the text naturally');
	});
});

describe('normalizeAiTranslatedFields', () => {
	test('normalizes slug-safe fields before applying them', () => {
		expect(
			normalizeAiTranslatedFields(
				{
					title: 'Consejos esenciales para compradores de vivienda',
					slug: 'Consejos esenciales para compradores de vivienda',
				},
				[
					{ field: 'title', type: 'string', meta: { interface: 'input' } },
					{ field: 'slug', type: 'string', meta: { options: { slug: true } } },
				] as any,
			),
		).toEqual({
			title: 'Consejos esenciales para compradores de vivienda',
			slug: 'consejos-esenciales-para-compradores-de-vivienda',
		});
	});
});

describe('resolveTranslationTargetPermission', () => {
	test('blocks targets with pending deletion before attempting permission fetches', async () => {
		const fetchItemUpdatePermission = vi.fn();

		await expect(
			resolveTranslationTargetPermission({
				isAdmin: false,
				isMarkedForDeletion: true,
				itemPrimaryKey: 1,
				hasCreatePermission: true,
				updatePermissionAccess: 'partial',
				fetchItemUpdatePermission,
			}),
		).resolves.toEqual({
			allowed: false,
			reason: 'pending-delete',
		});

		expect(fetchItemUpdatePermission).not.toHaveBeenCalled();
	});

	test('blocks new targets when create permission is missing', async () => {
		await expect(
			resolveTranslationTargetPermission({
				isAdmin: false,
				isMarkedForDeletion: false,
				itemPrimaryKey: undefined,
				hasCreatePermission: false,
				updatePermissionAccess: 'full',
				fetchItemUpdatePermission: vi.fn(),
			}),
		).resolves.toEqual({
			allowed: false,
			reason: 'not-allowed',
		});
	});

	test('checks item-level update permission when collection update access is partial', async () => {
		const fetchItemUpdatePermission = vi.fn().mockResolvedValue(true);

		await expect(
			resolveTranslationTargetPermission({
				isAdmin: false,
				isMarkedForDeletion: false,
				itemPrimaryKey: 7,
				hasCreatePermission: true,
				updatePermissionAccess: 'partial',
				fetchItemUpdatePermission,
			}),
		).resolves.toEqual({
			allowed: true,
		});

		expect(fetchItemUpdatePermission).toHaveBeenCalledOnce();
	});
});
