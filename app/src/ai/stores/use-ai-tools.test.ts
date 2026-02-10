import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import type { StaticToolDefinition } from '../composables/define-tool';
import { useAiToolsStore } from './use-ai-tools';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	localStorage.clear();
});

const createMockTool = (name: string): StaticToolDefinition => ({
	name,
	displayName: name,
	description: `Test tool ${name}`,
	inputSchema: z.object({}),
	execute: vi.fn(),
});

describe('useAiToolsStore', () => {
	describe('getToolApprovalMode', () => {
		test('returns "ask" by default', () => {
			const store = useAiToolsStore();
			expect(store.getToolApprovalMode('items')).toBe('ask');
			expect(store.getToolApprovalMode('unknown-tool')).toBe('ask');
		});

		test('returns stored value', () => {
			const store = useAiToolsStore();
			store.setToolApprovalMode('items', 'always');
			expect(store.getToolApprovalMode('items')).toBe('always');
		});
	});

	describe('setToolApprovalMode', () => {
		test('stores mode in toolApprovals', () => {
			const store = useAiToolsStore();

			store.setToolApprovalMode('items', 'always');
			expect(store.toolApprovals['items']).toBe('always');

			store.setToolApprovalMode('files', 'disabled');
			expect(store.toolApprovals['files']).toBe('disabled');
		});

		test('overwrites existing mode', () => {
			const store = useAiToolsStore();

			store.setToolApprovalMode('items', 'always');
			expect(store.getToolApprovalMode('items')).toBe('always');

			store.setToolApprovalMode('items', 'disabled');
			expect(store.getToolApprovalMode('items')).toBe('disabled');
		});
	});

	describe('enabledSystemTools', () => {
		test('returns all system tools when none disabled', () => {
			const store = useAiToolsStore();
			expect(store.enabledSystemTools).toEqual(store.systemTools);
		});

		test('filters out disabled tools', () => {
			const store = useAiToolsStore();

			store.setToolApprovalMode('items', 'disabled');
			store.setToolApprovalMode('files', 'disabled');

			expect(store.enabledSystemTools).not.toContain('items');
			expect(store.enabledSystemTools).not.toContain('files');
			expect(store.enabledSystemTools).toContain('schema');
		});
	});

	describe('registerLocalTool', () => {
		test('adds tool to localTools', () => {
			const store = useAiToolsStore();
			const tool = createMockTool('test-tool');

			store.registerLocalTool(tool);

			expect(store.localTools).toHaveLength(1);
			expect(store.localTools[0]!.name).toBe('test-tool');
		});

		test('can register multiple tools', () => {
			const store = useAiToolsStore();

			store.registerLocalTool(createMockTool('tool-1'));
			store.registerLocalTool(createMockTool('tool-2'));

			expect(store.localTools).toHaveLength(2);
		});
	});

	describe('replaceLocalTool', () => {
		test('replaces existing tool by name', () => {
			const store = useAiToolsStore();
			const original = createMockTool('my-tool');
			const replacement = { ...createMockTool('my-tool'), description: 'Updated description' };

			store.registerLocalTool(original);
			store.replaceLocalTool('my-tool', replacement);

			expect(store.localTools).toHaveLength(1);
			expect(store.localTools[0]!.description).toBe('Updated description');
		});

		test('does not add if tool not found', () => {
			const store = useAiToolsStore();
			const tool = createMockTool('nonexistent');

			store.replaceLocalTool('nonexistent', tool);

			expect(store.localTools).toHaveLength(0);
		});
	});

	describe('deregisterLocalTool', () => {
		test('removes tool by name', () => {
			const store = useAiToolsStore();

			store.registerLocalTool(createMockTool('tool-1'));
			store.registerLocalTool(createMockTool('tool-2'));
			store.deregisterLocalTool('tool-1');

			expect(store.localTools).toHaveLength(1);
			expect(store.localTools[0]!.name).toBe('tool-2');
		});

		test('no-op if tool not found', () => {
			const store = useAiToolsStore();

			store.registerLocalTool(createMockTool('tool-1'));
			store.deregisterLocalTool('nonexistent');

			expect(store.localTools).toHaveLength(1);
		});
	});

	describe('isSystemTool', () => {
		test('returns true for system tools', () => {
			const store = useAiToolsStore();

			expect(store.isSystemTool('items')).toBe(true);
			expect(store.isSystemTool('files')).toBe(true);
			expect(store.isSystemTool('schema')).toBe(true);
		});

		test('returns false for non-system tools', () => {
			const store = useAiToolsStore();

			expect(store.isSystemTool('custom-tool')).toBe(false);
			expect(store.isSystemTool('random')).toBe(false);
		});
	});

	describe('dehydrate', () => {
		test('clears toolApprovals', () => {
			const store = useAiToolsStore();

			store.setToolApprovalMode('items', 'always');
			store.setToolApprovalMode('files', 'disabled');

			store.dehydrate();

			expect(store.toolApprovals).toEqual({});
		});

		test('clears localTools', () => {
			const store = useAiToolsStore();

			store.registerLocalTool(createMockTool('tool-1'));
			store.registerLocalTool(createMockTool('tool-2'));

			store.dehydrate();

			expect(store.localTools).toEqual([]);
		});
	});
});
