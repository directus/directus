import type { ItemContextData, VisualElementContextData } from '@directus/ai';
import type { MCPPrompt } from './prompts';

export interface PromptContextData {
	text: string;
	prompt: MCPPrompt;
	values: Record<string, string>;
}

export type PendingContextItem =
	| { id: string; type: 'item'; data: ItemContextData; display: string }
	| { id: string; type: 'visual-element'; data: VisualElementContextData; display: string }
	| { id: string; type: 'prompt'; data: PromptContextData; display: string };

export function isVisualElement(
	item: PendingContextItem,
): item is Extract<PendingContextItem, { type: 'visual-element' }> {
	return item.type === 'visual-element';
}

export function isItemContext(item: PendingContextItem): item is Extract<PendingContextItem, { type: 'item' }> {
	return item.type === 'item';
}

export function isPromptContext(item: PendingContextItem): item is Extract<PendingContextItem, { type: 'prompt' }> {
	return item.type === 'prompt';
}
