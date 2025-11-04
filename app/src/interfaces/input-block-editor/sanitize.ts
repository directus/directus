import { isObject } from '@directus/utils';
import { OutputBlockData } from '@editorjs/editorjs';
import dompurify from 'dompurify';
import { cloneDeep, isString } from 'lodash';

export function sanitizeValue(value: any): EditorJS.OutputData | null {
	if (!value || typeof value !== 'object' || !value.blocks || value.blocks.length === 0) return null;

	const sanitizedBlocks = value.blocks.map((block: OutputBlockData) => ({
		...block,
		data: sanitizeBlockData(block.data),
	}));

	if (sanitizedBlocks.length === 0) return null;

	return cloneDeep({
		time: value?.time || Date.now(),
		version: value?.version || '0.0.0',
		blocks: sanitizedBlocks,
	});
}

export function sanitizeBlockData(data: unknown): unknown {
	if (Array.isArray(data)) {
		return data.map((item: unknown) => sanitizeBlockData(item));
	}

	if (isObject(data)) {
		const cleaned: Record<string, unknown> = {};

		for (const key in data) {
			if (!Object.prototype.hasOwnProperty.call(data, key)) {
				continue;
			}

			cleaned[key] = sanitizeBlockData(data[key]);
		}

		return cleaned;
	}

	if (isString(data)) {
		return dompurify.sanitize(data);
	}

	return data;
}
