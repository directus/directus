import type { PrimaryKey } from '@directus/types';
import type { MCPPrompt } from './prompts';

export const CONTEXT_TYPES = {
	ITEM: 'item',
	VISUAL_ELEMENT: 'visual-element',
	PROMPT: 'prompt',
} as const;

export type ContextType = (typeof CONTEXT_TYPES)[keyof typeof CONTEXT_TYPES];

export interface ItemContextData {
	collection: string;
	id: PrimaryKey;
	itemData: Record<string, unknown>;
}

export interface VisualElementContextData {
	key: string;
	collection: string;
	item: PrimaryKey;
	fields?: string[];
	rect?: { top: number; left: number; width: number; height: number };
}

export interface PromptContextData {
	text: string;
	prompt: MCPPrompt;
	values: Record<string, string>;
}

export type PendingContextItem =
	| { id: string; type: 'item'; data: ItemContextData; display: string }
	| { id: string; type: 'visual-element'; data: VisualElementContextData; display: string }
	| { id: string; type: 'prompt'; data: PromptContextData; display: string };

export type ContextAttachment =
	| { type: 'item'; data: ItemContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'visual-element'; data: VisualElementContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'prompt'; data: PromptContextData; display: string; snapshot: Record<string, unknown> };

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
