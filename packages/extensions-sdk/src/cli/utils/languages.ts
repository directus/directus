import { EXTENSION_LANGUAGES } from '@directus/constants';
import type { Language, LanguageShort } from '../types.js';
import { getFileExt } from './file.js';

export function isLanguage(language: string): language is Language {
	return (EXTENSION_LANGUAGES as readonly string[]).includes(language);
}

export function languageToShort(language: Language): LanguageShort {
	if (language === 'javascript') {
		return 'js';
	} else {
		return 'ts';
	}
}

export function getLanguageFromPath(path: string): string {
	const fileExtension = getFileExt(path);

	if (fileExtension === 'js') {
		return 'javascript';
	} else if (fileExtension === 'ts') {
		return 'typescript';
	} else {
		return fileExtension;
	}
}
