import api from '@/api';
import type { SystemTool, ToolApprovalMode as AiToolApprovalMode } from '@directus/ai';
import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import type { StaticToolDefinition } from '../composables/define-tool';

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

/**
 * Information about an external MCP tool
 */
export interface ExternalMCPToolInfo {
	/** Full tool name in format mcp:<server-id>:<tool-name> */
	name: string;
	/** Tool description */
	description: string;
	/** Server ID this tool belongs to */
	serverId: string;
	/** Server display name */
	serverName: string;
	/** Tool approval mode from server config */
	toolApproval: AiToolApprovalMode;
}

export const useAiToolsStore = defineStore('ai-tools-store', () => {
	const toolApprovals = useLocalStorage<Record<string, ToolApprovalMode>>('ai-tool-approvals', {});

	const systemTools = shallowRef<SystemTool[]>([
		'items',
		'files',
		'file-content',
		'folders',
		'flows',
		'trigger-flow',
		'operations',
		'schema',
		'collections',
		'fields',
		'relations',
	]);

	const localTools = shallowRef<StaticToolDefinition[]>([]);

	// External MCP tools fetched from the API
	const externalTools = shallowRef<ExternalMCPToolInfo[]>([]);
	const externalToolsLoading = ref(false);
	const externalToolsError = ref<string | null>(null);

	const enabledSystemTools = computed(() => {
		return systemTools.value.filter((tool) => getToolApprovalMode(tool) !== 'disabled');
	});

	// Filter external tools based on approval mode (exclude 'disabled')
	const enabledExternalTools = computed(() => {
		return externalTools.value.filter((tool) => getToolApprovalMode(tool.name) !== 'disabled');
	});

	// All available tools (system + external)
	const allTools = computed(() => {
		return [...systemTools.value, ...externalTools.value.map((t) => t.name)];
	});

	const systemToolResultHook =
		createEventHook<[tool: SystemTool, input: Record<string, unknown>, output: Record<string, unknown>]>();

	const getToolApprovalMode = (toolName: string): ToolApprovalMode => {
		return toolApprovals.value[toolName] ?? 'ask';
	};

	const setToolApprovalMode = (toolName: string, mode: ToolApprovalMode) => {
		toolApprovals.value = { ...toolApprovals.value, [toolName]: mode };
	};

	/**
	 * Fetch external MCP tools from the API
	 */
	const fetchExternalTools = async () => {
		externalToolsLoading.value = true;
		externalToolsError.value = null;

		try {
			const response = await api.get<{ data: ExternalMCPToolInfo[] }>('/ai/chat/tools');
			externalTools.value = response.data.data;

			// Set default approval modes based on server config
			for (const tool of externalTools.value) {
				if (!(tool.name in toolApprovals.value)) {
					toolApprovals.value = { ...toolApprovals.value, [tool.name]: tool.toolApproval as ToolApprovalMode };
				}
			}
		} catch (error) {
			externalToolsError.value = error instanceof Error ? error.message : 'Failed to fetch external tools';
			externalTools.value = [];
		} finally {
			externalToolsLoading.value = false;
		}
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
		externalTools.value = [];
		externalToolsError.value = null;
	};

	return {
		// State
		toolApprovals,
		systemTools,
		localTools,
		externalTools,
		externalToolsLoading,
		externalToolsError,

		// Computed
		enabledSystemTools,
		enabledExternalTools,
		allTools,

		// Actions
		getToolApprovalMode,
		setToolApprovalMode,
		fetchExternalTools,
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
