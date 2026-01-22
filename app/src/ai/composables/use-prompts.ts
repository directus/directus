import { useApi } from '@directus/composables';
import { generateId, type UIMessage } from 'ai';
import { render, tokenize } from 'micromustache';
import type { MCPPrompt } from '../types';
import { useSettingsStore } from '@/stores/settings';

// Re-export for backwards compatibility
export type { MCPPrompt };

/**
 * Sanitize template text by removing descriptions after colons in variable placeholders
 * Converts {{ variable: description }} to {{ variable }}
 */
function sanitizeTemplate(text: string): string {
	return text.replace(/\{\{\s*([^:}]+):[^}]*\}\}/g, '{{ $1 }}');
}

export function usePrompts() {
	const api = useApi();
	const settingsStore = useSettingsStore();

	/**
	 * Fetch published MCP prompts from the configured collection
	 */
	async function fetchPrompts(): Promise<MCPPrompt[]> {
		const collection = settingsStore.settings?.mcp_prompts_collection;

		if (!collection) {
			return [];
		}

		const response = await api.get(`/items/${collection}`, {
			params: {
				fields: ['id', 'name', 'description', 'status', 'system_prompt', 'messages'],
				filter: {
					status: { _eq: 'published' },
				},
				sort: 'name',
				limit: -1,
			},
		});

		return response.data.data || [];
	}

	/**
	 * Extract variable names from prompt text using micromustache
	 */
	function extractVariables(prompt: MCPPrompt): string[] {
		const variables = new Set<string>();

		// Extract from system_prompt
		if (prompt.system_prompt) {
			try {
				const sanitized = sanitizeTemplate(prompt.system_prompt);
				const tokens = tokenize(sanitized);

				for (const varName of tokens.varNames) {
					variables.add(varName);
				}
			} catch {
				// Silently skip tokenization errors
			}
		}

		// Extract from messages
		if (prompt.messages && Array.isArray(prompt.messages)) {
			prompt.messages.forEach((message) => {
				try {
					const sanitized = sanitizeTemplate(message.text);
					const tokens = tokenize(sanitized);

					for (const varName of tokens.varNames) {
						variables.add(varName);
					}
				} catch {
					// Silently skip tokenization errors
				}
			});
		}

		return Array.from(variables);
	}

	/**
	 * Render a prompt with provided variable values
	 */
	function renderPrompt(
		prompt: MCPPrompt,
		values: Record<string, string>,
	): {
		system_prompt?: string;
		messages: { role: 'user' | 'assistant'; text: string }[];
	} {
		let renderedSystemPrompt: string | undefined = undefined;

		if (prompt.system_prompt) {
			try {
				const sanitized = sanitizeTemplate(prompt.system_prompt);
				renderedSystemPrompt = render(sanitized, values);
			} catch {
				// If render fails, use the original text as-is
				renderedSystemPrompt = prompt.system_prompt;
			}
		}

		const renderedMessages =
			prompt.messages && Array.isArray(prompt.messages)
				? prompt.messages.map((msg) => {
						try {
							const sanitized = sanitizeTemplate(msg.text);
							return {
								role: msg.role,
								text: render(sanitized, values),
							};
						} catch {
							// If render fails, use the original text as-is
							return {
								role: msg.role,
								text: msg.text,
							};
						}
					})
				: [];

		return {
			system_prompt: renderedSystemPrompt,
			messages: renderedMessages,
		};
	}

	/**
	 * Convert MCP prompt to UIMessage array for chat
	 */
	function convertToUIMessages(prompt: MCPPrompt, values: Record<string, string>): UIMessage[] {
		const rendered = renderPrompt(prompt, values);
		const messages: UIMessage[] = [];

		// Add system prompt as system message
		if (rendered.system_prompt) {
			messages.push({
				id: generateId(),
				role: 'system',
				parts: [
					{
						type: 'text',
						text: rendered.system_prompt,
						state: 'done',
					},
				],
			});
		}

		// Add conversation messages
		rendered.messages.forEach((msg) => {
			messages.push({
				id: generateId(),
				role: msg.role,
				parts: [
					{
						type: 'text',
						text: msg.text,
						state: 'done',
					},
				],
			});
		});

		return messages;
	}

	return {
		fetchPrompts,
		extractVariables,
		renderPrompt,
		convertToUIMessages,
	};
}
