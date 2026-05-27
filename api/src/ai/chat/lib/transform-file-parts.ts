import type { UIMessage } from 'ai';
import { useLogger } from '../../../logger/index.js';

interface FileUIPart {
	type: 'file';
	mediaType: string;
	filename?: string;
	url: string;
	providerMetadata?: {
		directus?: {
			fileId: string;
			provider: string;
		};
		[key: string]: unknown;
	};
}

function isFileUIPart(part: unknown): part is FileUIPart {
	return typeof part === 'object' && part !== null && (part as FileUIPart).type === 'file';
}

/**
 * Transforms UIMessage file parts to use provider file_id instead of display URL.
 *
 * The frontend sends files with:
 * - url: display URL for UI rendering (blob: or /assets/ URL)
 * - providerMetadata.directus.fileId: the actual provider file ID
 *
 * This function replaces the url with the fileId so the AI SDK can use it
 * with the provider's native file handling.
 */
export function transformFilePartsForProvider(messages: UIMessage[]): UIMessage[] {
	const logger = useLogger();

	return messages.map((msg): UIMessage => {
		if (!Array.isArray(msg.parts)) {
			return msg;
		}

		const parts = [];

		for (const part of msg.parts) {
			if (!isFileUIPart(part)) {
				parts.push(part);
				continue;
			}

			const fileId = part.providerMetadata?.directus?.fileId;

			if (!fileId) {
				logger.warn('File part missing providerMetadata.directus.fileId, filtering out');
				continue;
			}

			parts.push({ ...part, url: fileId });
		}

		return { ...msg, parts };
	});
}
