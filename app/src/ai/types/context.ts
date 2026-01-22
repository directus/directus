import type { ItemContextData, VisualElementContextData } from '@directus/ai';
import type { MCPPrompt } from './prompts';

const CONTEXT_TYPES = {
	ITEM: 'item',
	VISUAL_ELEMENT: 'visual-element',
	PROMPT: 'prompt',
} as const;

export interface PromptContextData {
	text: string;
	prompt: MCPPrompt;
	values: Record<string, string>;
}

export type PendingContextItem =
	| { id: string; type: 'item'; data: ItemContextData; display: string }
	| { id: string; type: 'visual-element'; data: VisualElementContextData; display: string }
	| { id: string; type: 'prompt'; data: PromptContextData; display: string };

// Type guards
export function isVisualElement(
	item: PendingContextItem,
): item is Extract<PendingContextItem, { type: 'visual-element' }> {
	return item.type === CONTEXT_TYPES.VISUAL_ELEMENT;
}

export function isItemContext(item: PendingContextItem): item is Extract<PendingContextItem, { type: 'item' }> {
	return item.type === CONTEXT_TYPES.ITEM;
}

export function isPromptContext(item: PendingContextItem): item is Extract<PendingContextItem, { type: 'prompt' }> {
	return item.type === CONTEXT_TYPES.PROMPT;
}
