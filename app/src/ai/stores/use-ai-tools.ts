import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import type { StaticToolDefinition } from '../composables/define-tool';
import type { SystemTool } from '../types';

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

export const useAiToolsStore = defineStore('ai-tools-store', () => {
	// Tool approval settings (persisted)
	const toolApprovals = useLocalStorage<Record<string, ToolApprovalMode>>('ai-tool-approvals', {});

	// System tools available on the server
	const systemTools = shallowRef<SystemTool[]>([
		'items',
		'files',
		'folders',
		// Omit 'assets' because we don't support image or audio uploads yet
		// 'assets',
		'flows',
		'trigger-flow',
		'operations',
		'schema',
		'collections',
		'fields',
		'relations',
		// 'visual-elements' is now a local tool, not a system tool
	]);

	// Local tools registered by components
	const localTools = shallowRef<StaticToolDefinition[]>([]);

	// Filter system tools based on approval mode (exclude 'disabled')
	const enabledSystemTools = computed(() => {
		return systemTools.value.filter((tool) => getToolApprovalMode(tool) !== 'disabled');
	});

	// Event hook for system tool results
	const systemToolResultHook =
		createEventHook<[tool: SystemTool, input: Record<string, unknown>, output: Record<string, unknown>]>();

	const getToolApprovalMode = (toolName: string): ToolApprovalMode => {
		return toolApprovals.value[toolName] ?? 'ask';
	};

	const setToolApprovalMode = (toolName: string, mode: ToolApprovalMode) => {
		toolApprovals.value = { ...toolApprovals.value, [toolName]: mode };
	};

	const setAllToolsMode = (mode: ToolApprovalMode) => {
		const newApprovals: Record<string, ToolApprovalMode> = {};

		for (const tool of systemTools.value) {
			newApprovals[tool] = mode;
		}

		toolApprovals.value = newApprovals;
	};

	const registerLocalTool = (tool: StaticToolDefinition) => {
		localTools.value = [...localTools.value, tool];
	};

	const replaceLocalTool = (name: string, tool: StaticToolDefinition) => {
		localTools.value = localTools.value.map((t) => (t.name === name ? tool : t));
	};

	const deregisterLocalTool = (name: string) => {
		localTools.value = localTools.value.filter((t) => t.name !== name);
	};

	const isSystemTool = (toolName: string): toolName is SystemTool => {
		return systemTools.value.includes(toolName as SystemTool);
	};

	const dehydrate = () => {
		toolApprovals.value = {};
		localTools.value = [];
	};

	return {
		// State
		toolApprovals,
		systemTools,
		localTools,

		// Computed
		enabledSystemTools,

		// Actions
		getToolApprovalMode,
		setToolApprovalMode,
		setAllToolsMode,
		registerLocalTool,
		replaceLocalTool,
		deregisterLocalTool,
		isSystemTool,
		dehydrate,

		// Event hooks
		onSystemToolResult: systemToolResultHook.on,
		triggerSystemToolResult: systemToolResultHook.trigger,
	};
});
