import type { ChatContext } from '../models/chat-request.js';

interface VisualElementData {
	collection?: string;
	item?: unknown;
	fields?: string[];
}

interface PromptSnapshot {
	text?: string;
}

interface Attachment {
	type: string;
	display: string;
	data?: unknown;
	snapshot?: unknown;
}

/**
 * Format visual elements into a dedicated block
 */
function formatVisualElements(attachments: Attachment[]): string | null {
	const visualElements = attachments.filter((att) => att.type === 'visual-element');

	if (visualElements.length === 0) return null;

	const elementLines = visualElements.map((att) => {
		const data = att.data as VisualElementData;
		const fields = data.fields?.length ? data.fields.join(', ') : 'all';

		return `### ${data.collection}/${data.item} — "${att.display}"
Editable fields: ${fields}
\`\`\`json
${JSON.stringify(att.snapshot, null, 2)}
\`\`\``;
	});

	return `<visual_editing>
## Selected Elements
The user selected these elements for editing in the visual editor.
These elements are the PRIMARY focus of the user's request — prioritize them over page context.

${elementLines.join('\n\n')}

IMPORTANT: Use the items tool with action: 'update' to modify these elements.
Do NOT use form-values tools — those modify the page form, not the selected visual elements.
</visual_editing>`;
}

/**
 * Format non-visual attachments
 */
function formatOtherAttachments(attachments: Attachment[]): string | null {
	const otherAttachments = attachments.filter((att) => att.type !== 'visual-element');

	if (otherAttachments.length === 0) return null;

	const attachmentLines = otherAttachments.map((att) => {
		if (att.type === 'item') {
			return `[Item: ${att.display}]\n${JSON.stringify(att.snapshot, null, 2)}`;
		}

		if (att.type === 'prompt') {
			const snapshot = att.snapshot as PromptSnapshot;
			return `[Prompt: ${att.display}]\n${snapshot.text ?? ''}`;
		}

		return '';
	});

	const filtered = attachmentLines.filter(Boolean);

	if (filtered.length === 0) return null;

	return `## User-Added Context\n${filtered.join('\n\n')}`;
}

/**
 * Format context for appending to system prompt
 */
export function formatContextForSystemPrompt(context: ChatContext): string {
	const sections: string[] = [];

	if (context.page) {
		const page = context.page;
		const pageLines = [`Path: ${page.path}`];

		if (page.collection) pageLines.push(`Collection: ${page.collection}`);
		if (page.item !== undefined) pageLines.push(`Item: ${page.item}`);
		if (page.module) pageLines.push(`Module: ${page.module}`);

		sections.push(`## Current Page\n${pageLines.join('\n')}`);
	}

	if (context.attachments && context.attachments.length > 0) {
		const otherContext = formatOtherAttachments(context.attachments as Attachment[]);

		if (otherContext) {
			sections.push(otherContext);
		}
	}

	let result = '';

	if (sections.length > 0) {
		result = `\n\n<user_context>\n${sections.join('\n\n')}\n</user_context>`;
	}

	if (context.attachments && context.attachments.length > 0) {
		const visualBlock = formatVisualElements(context.attachments as Attachment[]);

		if (visualBlock) {
			result += `\n\n${visualBlock}`;
		}
	}

	return result;
}
