import type { UIMessage } from 'ai';

/**
 * Fixes tool calls with error states by copying rawInput to input field.
 * This is required because error tool calls from the frontend use rawInput
 * but the AI SDK's convertToModelMessages expects input to generate arguments
 * for the OpenAI API.
 * @param messages - Array of message objects from the chat request
 * @returns Messages with error tool calls fixed, typed as UIMessage[]
 */
export const fixErrorToolCalls = (messages: { [x: string]: unknown }[]): UIMessage[] => {
	return messages.map((msg) => {
		if (msg['role'] === 'assistant' && msg['parts'] && Array.isArray(msg['parts'])) {
			const fixedParts = (msg['parts'] as unknown[]).map((part) => {
				if (
					typeof part === 'object' &&
					part !== null &&
					'type' in part &&
					typeof part.type === 'string' &&
					part.type.startsWith('tool-') &&
					'state' in part &&
					part.state === 'output-error' &&
					'rawInput' in part &&
					(!('input' in part) || part.input == null)
				) {
					return { ...part, input: part.rawInput };
				}

				return part;
			});

			return { ...msg, parts: fixedParts };
		}

		return msg;
	}) as unknown as UIMessage[];
};
