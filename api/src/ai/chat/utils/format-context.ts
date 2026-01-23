import type { ChatContext } from '../models/chat-request.js';

interface VisualElementData {
	collection?: string;
	item?: unknown;
	fields?: string[];
}

interface PromptSnapshot {
	text?: string;
	messages?: { role: string; text: string }[];
}

interface Attachment {
	type: string;
	display: string;
	data?: unknown;
	snapshot?: unknown;
}

interface GroupedAttachments {
	visualElements: Attachment[];
	prompts: Attachment[];
	items: Attachment[];
}

function groupAttachments(attachments: Attachment[]): GroupedAttachments {
	const groups: GroupedAttachments = { visualElements: [], prompts: [], items: [] };

	for (const att of attachments) {
		if (att.type === 'visual-element') {
			groups.visualElements.push(att);
		} else if (att.type === 'prompt') {
			groups.prompts.push(att);
		} else if (att.type === 'item') {
			groups.items.push(att);
		}
	}

	return groups;
}

function formatVisualElement(att: Attachment): string {
	const data = att.data as VisualElementData;
	const fields = data.fields?.length ? data.fields.join(', ') : 'all';

	return `### ${data.collection}/${data.item} — "${att.display}"
Editable fields: ${fields}
\`\`\`json
${JSON.stringify(att.snapshot, null, 2)}
\`\`\``;
}

function formatPrompt(att: Attachment): string {
	const snapshot = att.snapshot as PromptSnapshot;
	const lines: string[] = [];

	if (snapshot.text) {
		lines.push(snapshot.text);
	}

	if (snapshot.messages?.length) {
		lines.push('\n### Example Exchange');

		for (const msg of snapshot.messages) {
			lines.push(`**${msg.role}**: ${msg.text}`);
		}
	}

	return `### ${att.display}\n${lines.join('\n')}`;
}

function formatItem(att: Attachment): string {
	const data = att.data as { collection?: string };
	const collectionLabel = data.collection ? ` (${data.collection})` : '';
	return `[Item: ${att.display}${collectionLabel}]\n${JSON.stringify(att.snapshot, null, 2)}`;
}

/**
 * Format context for appending to system prompt
 */
export function formatContextForSystemPrompt(context: ChatContext): string {
	const attachments = (context.attachments ?? []) as Attachment[];
	const groups = groupAttachments(attachments);
	const parts: string[] = [];

	// 1. Custom instructions (prompts) - highest priority, placed first
	if (groups.prompts.length > 0) {
		const promptBlocks = groups.prompts.map(formatPrompt).join('\n\n');

		parts.push(`<custom_instructions>
The user has applied the following prompt(s) to guide your behavior:

${promptBlocks}
</custom_instructions>`);
	}

	// 2. User context (current page + items)
	const sections: string[] = [];

	const now = new Date();
	sections.push(`## Current Date\n${now.toISOString().split('T')[0]}`);

	if (context.page) {
		const page = context.page;
		const pageLines = [`Path: ${page.path}`];

		if (page.collection) pageLines.push(`Collection: ${page.collection}`);
		if (page.item !== undefined) pageLines.push(`Item: ${page.item}`);
		if (page.module) pageLines.push(`Module: ${page.module}`);

		sections.push(`## Current Page\n${pageLines.join('\n')}`);
	}

	if (groups.items.length > 0) {
		const itemLines = groups.items.map(formatItem).join('\n\n');

		sections.push(`## User-Added Context
The user has attached these items as reference for their request.
All root-level fields are included. Use the items tool to fetch additional fields or update items when asked.

${itemLines}`);
	}

	if (sections.length > 0) {
		parts.push(`<user_context>\n${sections.join('\n\n')}\n</user_context>`);
	}

	// 3. Visual editing context
	if (groups.visualElements.length > 0) {
		const elementLines = groups.visualElements.map(formatVisualElement).join('\n\n');

		parts.push(`<visual_editing>
## Selected Elements
The user selected these elements for editing in the visual editor.

${elementLines}
</visual_editing>`);
	}

	// 4. Attachment rules (only if any attachments exist)
	if (attachments.length > 0) {
		parts.push(`## Attachment Rules
User-added attachments shoud have higher priority than page context.
Do NOT use form-values tools for attachments — those only modify the current page form.`);
	}

	if (parts.length === 0) return '';

	return '\n\n' + parts.join('\n\n');
}
