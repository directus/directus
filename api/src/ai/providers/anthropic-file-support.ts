import { createAnthropic } from '@ai-sdk/anthropic';
import { useLogger } from '../../logger/index.js';

interface AnthropicMessageContent {
	type: string;
	source?: {
		type: string;
		media_type?: string;
		data?: string;
		file_id?: string;
	};
	[key: string]: unknown;
}

interface AnthropicMessage {
	role: string;
	content?: AnthropicMessageContent[];
	[key: string]: unknown;
}

interface AnthropicRequestBody {
	messages?: AnthropicMessage[];
	[key: string]: unknown;
}

/**
 * Creates an Anthropic provider with file_id support.
 *
 * The AI SDK's @ai-sdk/anthropic provider doesn't support Anthropic's Files API file_id.
 * This wrapper intercepts the HTTP request and transforms base64 sources that contain
 * a file_id marker into the native Anthropic file source format.
 *
 * When the AI SDK converts a FileUIPart with url=file_id, it creates a base64 source
 * with the file_id as the data (since it's not a valid URL or base64). We detect this
 * pattern and transform it to use the native file source type.
 */
export function createAnthropicWithFileSupport(apiKey: string) {
	return createAnthropic({
		apiKey,
		fetch: async (url, options) => {
			if (!options?.body || typeof options.body !== 'string') {
				return fetch(url, options);
			}

			try {
				const body: AnthropicRequestBody = JSON.parse(options.body);

				if (!body.messages) {
					return fetch(url, options);
				}

				const { messages, hasFileIds } = transformMessagesForFileId(body.messages);
				body.messages = messages;

				const headersObj: Record<string, string> = {};

				if (options.headers instanceof Headers) {
					options.headers.forEach((value, key) => {
						headersObj[key] = value;
					});
				} else {
					Object.assign(headersObj, options.headers as Record<string, string>);
				}

				if (hasFileIds) {
					const existing = headersObj['anthropic-beta'];
					const betaFlag = 'files-api-2025-04-14';

					if (!existing?.includes(betaFlag)) {
						headersObj['anthropic-beta'] = existing ? `${existing},${betaFlag}` : betaFlag;
					}
				}

				return fetch(url, {
					...options,
					headers: headersObj,
					body: JSON.stringify(body),
				});
			} catch (error) {
				if (error instanceof SyntaxError) {
					const logger = useLogger();
					logger.warn('Anthropic file support: could not parse request body, skipping file_id transformation');
					return fetch(url, options);
				}

				throw error;
			}
		},
	});
}

interface TransformResult {
	messages: AnthropicMessage[];
	hasFileIds: boolean;
}

/**
 * Transforms messages to use file_id source type where applicable.
 *
 * The AI SDK converts FileUIPart.url to base64 source data. When url is a file_id
 * (starts with "file_"), the data field contains the file_id string.
 * We detect this and convert to native Anthropic file source format.
 */
function transformMessagesForFileId(messages: AnthropicMessage[]): TransformResult {
	let hasFileIds = false;

	const transformedMessages = messages.map((msg) => {
		if (!msg.content || !Array.isArray(msg.content)) {
			return msg;
		}

		return {
			...msg,
			content: msg.content.map((block) => {
				// Check if this is an image or document with base64 source
				if (
					(block.type === 'image' || block.type === 'document') &&
					block.source?.type === 'base64' &&
					typeof block.source.data === 'string' &&
					block.source.data.startsWith('file_')
				) {
					const fileId = block.source.data;
					hasFileIds = true;

					return {
						...block,
						source: {
							type: 'file',
							file_id: fileId,
						},
					};
				}

				return block;
			}),
		};
	});

	return { messages: transformedMessages, hasFileIds };
}
