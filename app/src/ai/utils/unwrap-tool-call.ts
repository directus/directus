/**
 * Directus server tools run through the root `execute` meta-tool, so a `tool-execute` part
 * carries the real tool identity and arguments as `input.{name,input}`. Unwrap those for
 * display, approval keys, and system-tool-result hooks; other parts pass through unchanged.
 */
export function unwrapToolCall(part: { type: string; input?: unknown }): { toolName: string; input: unknown } {
	if (part.type === 'tool-execute' && part.input && typeof part.input === 'object') {
		const { name, input } = part.input as { name?: unknown; input?: unknown };

		if (typeof name === 'string') {
			return { toolName: name, input };
		}
	}

	return { toolName: part.type.replace('tool-', ''), input: part.input };
}
