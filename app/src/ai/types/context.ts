import type { ItemContextData, ProviderFileRef, VisualElementContextData } from '@directus/ai';
import type { MCPPrompt } from './prompts';

export type { ProviderFileRef };

export interface PromptContextData {
	text: string;
	prompt: MCPPrompt;
	values: Record<string, string>;
}

export interface FileContextData {
	id: string;
	filename_download: string;
	type: string;
	title: string;
}

export interface LocalFileContextData {
	file: File;
	thumbnailUrl?: string;
}

export type PendingContextItem =
	| { id: string; type: 'item'; data: ItemContextData; display: string }
	| { id: string; type: 'visual-element'; data: VisualElementContextData; display: string }
	| { id: string; type: 'prompt'; data: PromptContextData; display: string }
	| { id: string; type: 'file'; data: FileContextData; display: string }
	| { id: string; type: 'local-file'; data: LocalFileContextData; display: string };

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

export function isFileContext(item: PendingContextItem): item is Extract<PendingContextItem, { type: 'file' }> {
	return item.type === 'file';
}

export function isLocalFileContext(
	item: PendingContextItem,
): item is Extract<PendingContextItem, { type: 'local-file' }> {
	return item.type === 'local-file';
}
