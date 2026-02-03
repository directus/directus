import type { ChatContext, ContextAttachment } from '../models/chat-request.js';

function escapeAngleBrackets(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface PromptSnapshot {
	text?: string;
	messages?: { role: string; text: string }[];
}

interface GroupedAttachments {
	visualElements: Extract<ContextAttachment, { type: 'visual-element' }>[];
	prompts: Extract<ContextAttachment, { type: 'prompt' }>[];
	items: Extract<ContextAttachment, { type: 'item' }>[];
}

function groupAttachments(attachments: ContextAttachment[]): GroupedAttachments {
	const groups: GroupedAttachments = { visualElements: [], prompts: [], items: [] };

	for (const att of attachments) {
		switch (att.type) {
			case 'visual-element':
				groups.visualElements.push(att);
				break;
			case 'prompt':
				groups.prompts.push(att);
				break;
			case 'item':
				groups.items.push(att);
				break;
		}
	}

	return groups;
}

function formatVisualElement(att: ContextAttachment & { type: 'visual-element' }): string {
	const fields = att.data.fields?.length ? att.data.fields.map((f) => escapeAngleBrackets(f)).join(', ') : 'all';
	const collection = escapeAngleBrackets(String(att.data.collection));
	const item = escapeAngleBrackets(String(att.data.item));
	const display = escapeAngleBrackets(att.display);

	return `### ${collection}/${item} — "${display}"
Editable fields: ${fields}
\`\`\`json
${escapeAngleBrackets(JSON.stringify(att.snapshot, null, 2))}
\`\`\``;
}

function formatPrompt(att: ContextAttachment & { type: 'prompt' }): string {
	const snapshot = att.snapshot as PromptSnapshot;
	const lines: string[] = [];
	const display = escapeAngleBrackets(att.display);

	if (snapshot.text) {
		lines.push(escapeAngleBrackets(snapshot.text));
	}

	if (snapshot.messages?.length) {
		lines.push('\n### Example Exchange');

		for (const msg of snapshot.messages) {
			const role = escapeAngleBrackets(msg.role);
			const text = escapeAngleBrackets(msg.text);
			lines.push(`**${role}**: ${text}`);
		}
	}

	return `### ${display}\n${lines.join('\n')}`;
}

function formatItem(att: ContextAttachment & { type: 'item' }): string {
	const display = escapeAngleBrackets(att.display);
	const collectionLabel = att.data.collection ? ` (${escapeAngleBrackets(att.data.collection)})` : '';
	const keyLabel = ` — key: ${escapeAngleBrackets(String(att.data.key))}`;
	const collection = att.data.collection ? escapeAngleBrackets(att.data.collection) : '';

	const updateHint = att.data.collection
		? `\nTo update this item, use the items tool with: collection="${collection}", keys=["${escapeAngleBrackets(String(att.data.key))}"], action="update"`
		: '\nUse the items tool to update this item.';

	return `[Item: ${display}${collectionLabel}${keyLabel}]${updateHint}\n${escapeAngleBrackets(JSON.stringify(att.snapshot, null, 2))}`;
}

/**
 * Format context for appending to system prompt
 */
export function formatContextForSystemPrompt(context: ChatContext): string {
	const attachments = context.attachments ?? [];
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
		const pageLines = [`Path: ${escapeAngleBrackets(String(page.path))}`];

		if (page.collection) pageLines.push(`Collection: ${escapeAngleBrackets(String(page.collection))}`);
		if (page.item !== undefined) pageLines.push(`Item: ${escapeAngleBrackets(String(page.item))}`);
		if (page.module) pageLines.push(`Module: ${escapeAngleBrackets(String(page.module))}`);

		sections.push(`## Current Page\n${pageLines.join('\n')}`);
	}

	if (groups.items.length > 0) {
		const itemLines = groups.items.map(formatItem).join('\n\n');

		sections.push(`## User-Added Context
The user has attached these items as reference for their request.
All root-level fields the user has access to are shown below — use these exact field names when updating.
Use the items tool to fetch additional fields or update items when asked.

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
- User-added attachments have HIGHER PRIORITY than page context.
- To modify attached items, ALWAYS use the items tool with action: 'update'. NEVER use form-values tools for attached items.
- form-values tools ONLY affect the currently open page form, which may be a DIFFERENT item than what the user attached.`);
	}

	if (parts.length === 0) return '';

	return '\n\n' + parts.join('\n\n');
}
