/**
 * Extracts the provider and model name from a composite AI model identifier.
 *
 * @param id - The composite model identifier in the format "provider:model"
 * @returns An object containing the separated provider and model strings
 *
 * @example
 * ```ts
 * extractFromId('openai:gpt-4');
 * // Returns: { provider: 'openai', model: 'gpt-4' }
 * ```
 */
export const extractFromId = (id: string) => {
	const [provider, model] = id.split(':');

	if (!provider || !model) {
		throw new Error(`Invalid model identifier format. Expected "provider:model". Given "${id}"`);
	}

	return {
		provider, model
	};
}
