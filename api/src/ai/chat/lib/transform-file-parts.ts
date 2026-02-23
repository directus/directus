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

	return messages.map((msg) => {
		if (!Array.isArray(msg.parts)) {
			return msg;
		}

		return {
			...msg,
			parts: msg.parts
				.map((part) => {
					if (!isFileUIPart(part)) {
						return part;
					}

					const fileId = part.providerMetadata?.directus?.fileId;

					if (!fileId) {
						logger.warn('File part missing providerMetadata.directus.fileId, filtering out');
						return null;
					}

					return {
						...part,
						url: fileId,
					};
				})
				.filter((part): part is NonNullable<typeof part> => part !== null),
		};
	}) as UIMessage[];
}
