import type { SystemTool } from '@directus/ai';
import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import type { StaticToolDefinition } from '../composables/define-tool';

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

const rootServerTools = ['search', 'execute', 'schema'] as const;

export const useAiToolsStore = defineStore('ai-tools-store', () => {
	const toolApprovals = useLocalStorage<Record<string, ToolApprovalMode>>('ai-tool-approvals', {});

	const systemTools = shallowRef<SystemTool[]>([
		'items',
		'files',
		'folders',
		'flows',
		'trigger-flow',
		'operations',
		'collections',
		'fields',
		'relations',
	]);

	const localTools = shallowRef<StaticToolDefinition[]>([]);

	const enabledSystemTools = computed(() => {
		return systemTools.value.filter((tool) => getToolApprovalMode(tool) !== 'disabled');
	});

	const systemToolResultHook =
		createEventHook<[tool: SystemTool, input: Record<string, unknown>, output: Record<string, unknown>]>();

	const getToolApprovalMode = (toolName: string): ToolApprovalMode => {
		return toolApprovals.value[toolName] ?? 'ask';
	};

	const setToolApprovalMode = (toolName: string, mode: ToolApprovalMode) => {
		toolApprovals.value = { ...toolApprovals.value, [toolName]: mode };
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

	const isServerTool = (toolName: string): boolean => {
		return isSystemTool(toolName) || rootServerTools.includes(toolName as (typeof rootServerTools)[number]);
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
		registerLocalTool,
		replaceLocalTool,
		deregisterLocalTool,
		isSystemTool,
		isServerTool,
		dehydrate,

		// Event hooks
		onSystemToolResult: systemToolResultHook.on,
		triggerSystemToolResult: systemToolResultHook.trigger,
	};
});
