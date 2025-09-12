import type { EditorConfig } from '@directus/extensions';
import { sortBy } from 'lodash';
import { App } from 'vue';

let registeredEditors: string[] = [];

export function getInternalEditors(): EditorConfig[] {
	const editors = import.meta.glob<EditorConfig>('./*/index.ts', { import: 'default', eager: true });

	return sortBy(Object.values(editors), 'id');
}

export function registerEditors(editors: EditorConfig[], app: App): void {
	registeredEditors = [];

	for (const editor of editors) {
		const componentName = `editor-${editor.id}`;
		app.component(componentName, editor.component);
		registeredEditors.push(componentName);
	}
}

export async function deregisterEditors(): Promise<void> {
	// Editors don't need explicit deregistration since they're just Vue components
	registeredEditors = [];
}
