import { describe, it, expect, vi } from 'vitest';
import { createApp } from 'vue';
import type { EditorConfig } from '@directus/extensions';
import { registerEditors, deregisterEditors } from './index';

describe('editors index', () => {
	describe('registerEditors', () => {
		it('should register editor components with app', () => {
			const app = createApp({});
			app.component = vi.fn();
			
			const editors: EditorConfig[] = [
				{
					id: 'test-editor',
					name: 'Test Editor',
					icon: 'edit',
					component: { name: 'TestEditor' },
				},
			];

			registerEditors(editors, app);

			expect(app.component).toHaveBeenCalledWith('editor-test-editor', { name: 'TestEditor' });
		});

		it('should register multiple editors', () => {
			const app = createApp({});
			app.component = vi.fn();
			
			const editors: EditorConfig[] = [
				{
					id: 'editor-1',
					name: 'Editor 1',
					icon: 'edit',
					component: { name: 'Editor1' },
				},
				{
					id: 'editor-2', 
					name: 'Editor 2',
					icon: 'text',
					component: { name: 'Editor2' },
				},
			];

			registerEditors(editors, app);

			expect(app.component).toHaveBeenCalledTimes(2);
			expect(app.component).toHaveBeenNthCalledWith(1, 'editor-editor-1', { name: 'Editor1' });
			expect(app.component).toHaveBeenNthCalledWith(2, 'editor-editor-2', { name: 'Editor2' });
		});

		it('should handle empty editors array', () => {
			const app = createApp({});
			app.component = vi.fn();
			
			registerEditors([], app);
			expect(app.component).not.toHaveBeenCalled();
		});
	});

	describe('deregisterEditors', () => {
		it('should deregister editors without errors', async () => {
			await expect(deregisterEditors()).resolves.not.toThrow();
		});
	});
});
