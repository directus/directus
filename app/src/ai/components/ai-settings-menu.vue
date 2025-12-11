<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiStore, type ExternalMCPToolInfo, type ToolApprovalMode } from '../stores/use-ai';
import { SystemTool } from '../types/system-tool';

const { t } = useI18n();
const aiStore = useAiStore();

const menuOpen = ref(false);
const searchQuery = ref('');

watch(menuOpen, (open) => {
	if (!open) searchQuery.value = '';

	// Refresh external tools when menu opens
	if (open) {
		aiStore.fetchExternalTools();
	}
});

const systemTools = aiStore.systemTools;

const filterBySearch = (tools: string[]) => {
	if (!searchQuery.value) return tools;
	const query = searchQuery.value.toLowerCase();
	return tools.filter((tool) => formatTitle(tool).toLowerCase().includes(query));
};

const filterExternalBySearch = (tools: ExternalMCPToolInfo[]) => {
	if (!searchQuery.value) return tools;
	const query = searchQuery.value.toLowerCase();
	return tools.filter(
		(tool) =>
			tool.name.toLowerCase().includes(query) ||
			tool.serverName.toLowerCase().includes(query) ||
			tool.description.toLowerCase().includes(query),
	);
};

const enabledTools = computed(() =>
	filterBySearch(systemTools.filter((t) => aiStore.getToolApprovalMode(t) !== 'disabled')),
);

const disabledTools = computed(() =>
	filterBySearch(systemTools.filter((t) => aiStore.getToolApprovalMode(t) === 'disabled')),
);

// External tools grouped by server (reserved for future use)
const _externalToolsByServer = computed(() => {
	const grouped = new Map<string, { serverName: string; tools: ExternalMCPToolInfo[] }>();

	for (const tool of aiStore.externalTools) {
		if (!grouped.has(tool.serverId)) {
			grouped.set(tool.serverId, { serverName: tool.serverName, tools: [] });
		}

		grouped.get(tool.serverId)!.tools.push(tool);
	}

	return grouped;
});

const enabledExternalTools = computed(() =>
	filterExternalBySearch(aiStore.externalTools.filter((t) => aiStore.getToolApprovalMode(t.name) !== 'disabled')),
);

const disabledExternalTools = computed(() =>
	filterExternalBySearch(aiStore.externalTools.filter((t) => aiStore.getToolApprovalMode(t.name) === 'disabled')),
);

/**
 * Extract the tool name from a full MCP tool name (mcp__server-id__tool-name)
 * Handles cases where tool name itself may contain double underscores
 */
function getExternalToolDisplayName(fullName: string): string {
	const prefix = 'mcp__';

	if (!fullName.startsWith(prefix)) {
		return formatTitle(fullName);
	}

	const withoutPrefix = fullName.slice(prefix.length);
	const separatorIndex = withoutPrefix.indexOf('__');

	if (separatorIndex === -1) {
		return formatTitle(fullName);
	}

	const toolName = withoutPrefix.slice(separatorIndex + 2);
	return formatTitle(toolName);
}

const approvalModeOptions = computed(() => [
	{ text: t('ai.tool_approval.always'), value: 'always', icon: 'check', color: 'var(--theme--success)' },
	{ text: t('ai.tool_approval.ask'), value: 'ask', icon: 'approval_delegation', color: 'var(--theme--warning)' },
	{ text: t('ai.tool_approval.disabled'), value: 'disabled', icon: 'block', color: 'var(--theme--danger)' },
]);

const toolIcons: Record<SystemTool, string> = {
	items: 'box',
	files: 'folder',
	folders: 'folder_open',
	assets: 'image',
	flows: 'bolt',
	'trigger-flow': 'play_arrow',
	operations: 'offline_bolt',
	schema: 'database_search',
	collections: 'database',
	fields: 'variable_add',
	relations: 'hub',
};

const toolOptions = computed(() => {
	const map = new Map<string, { icon: string; approval: (typeof approvalModeOptions.value)[0] }>();

	for (const tool of systemTools) {
		const mode = aiStore.getToolApprovalMode(tool);

		map.set(tool, {
			icon: toolIcons[tool] || 'build',
			approval: approvalModeOptions.value.find((o) => o.value === mode)!,
		});
	}

	// Add external tools to the map
	for (const tool of aiStore.externalTools) {
		const mode = aiStore.getToolApprovalMode(tool.name);

		map.set(tool.name, {
			icon: 'cloud',
			approval: approvalModeOptions.value.find((o) => o.value === mode)!,
		});
	}

	return map;
});

function onApprovalModeChange(toolName: string, mode: ToolApprovalMode) {
	aiStore.setToolApprovalMode(toolName, mode);
}
</script>

<template>
	<div class="ai-settings-menu">
		<v-menu v-model="menuOpen" placement="top-start" show-arrow :close-on-content-click="false" full-height>
			<template #activator="{ toggle }">
				<v-button v-tooltip.left="$t('ai.settings')" x-small icon secondary @click="toggle">
					<v-icon name="settings" small />
				</v-button>
			</template>

			<div class="settings-container">
				<div class="search-header">
					<v-input v-model="searchQuery" :placeholder="$t('search')" small autofocus>
						<template #prepend>
							<v-icon name="search" small />
						</template>
					</v-input>
				</div>

				<v-list>
					<!-- Enabled System Tools -->
					<template v-if="enabledTools.length > 0">
						<v-list-item class="tool-item section-header" disabled>
							<v-list-item-content>
								<span class="section-title">{{ $t('ai.enabled_tools') }}</span>
							</v-list-item-content>
						</v-list-item>

						<v-list-item v-for="toolName in enabledTools" :key="toolName" class="tool-item">
							<v-list-item-icon>
								<v-icon :name="toolOptions.get(toolName)?.icon ?? 'build'" small />
							</v-list-item-icon>
							<v-list-item-content>
								<div class="tool-row">
									<span v-tooltip="$t(`ai.tool_descriptions.${toolName}`)" class="tool-name">
										{{ $t(`ai_tools.${toolName}`) }}
									</span>
									<v-select
										:model-value="aiStore.getToolApprovalMode(toolName)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(toolName, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(toolName)?.approval?.color }">
												<v-icon :name="toolOptions.get(toolName)?.approval?.icon" x-small />
												{{ toolOptions.get(toolName)?.approval?.text }}
											</div>
										</template>
									</v-select>
								</div>
							</v-list-item-content>
						</v-list-item>
					</template>

					<!-- Enabled External Tools -->
					<template v-if="enabledExternalTools.length > 0">
						<v-divider v-if="enabledTools.length > 0" />

						<v-list-item class="tool-item section-header" disabled>
							<v-list-item-content>
								<span class="section-title">{{ $t('ai.external_tools') }}</span>
							</v-list-item-content>
						</v-list-item>

						<v-list-item v-for="tool in enabledExternalTools" :key="tool.name" class="tool-item">
							<v-list-item-icon>
								<v-icon name="cloud" small />
							</v-list-item-icon>
							<v-list-item-content>
								<div class="tool-row">
									<div class="tool-info">
										<span v-tooltip="tool.description" class="tool-name">
											{{ getExternalToolDisplayName(tool.name) }}
										</span>
										<span class="server-name">{{ tool.serverName }}</span>
									</div>
									<v-select
										:model-value="aiStore.getToolApprovalMode(tool.name)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(tool.name, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(tool.name)?.approval?.color }">
												<v-icon :name="toolOptions.get(tool.name)?.approval?.icon" x-small />
												{{ toolOptions.get(tool.name)?.approval?.text }}
											</div>
										</template>
									</v-select>
								</div>
							</v-list-item-content>
						</v-list-item>
					</template>

					<!-- Loading External Tools -->
					<template v-if="aiStore.externalToolsLoading">
						<v-divider v-if="enabledTools.length > 0" />
						<v-list-item class="tool-item" disabled>
							<v-list-item-icon>
								<v-progress-circular indeterminate x-small />
							</v-list-item-icon>
							<v-list-item-content>
								<span class="tool-name">{{ $t('ai.loading_external_tools') }}</span>
							</v-list-item-content>
						</v-list-item>
					</template>

					<!-- Disabled Tools -->
					<template v-if="disabledTools.length > 0 || disabledExternalTools.length > 0">
						<v-divider v-if="enabledTools.length > 0 || enabledExternalTools.length > 0" />

						<v-list-item class="tool-item section-header" disabled>
							<v-list-item-content>
								<span class="section-title">{{ $t('ai.disabled_tools') }}</span>
							</v-list-item-content>
						</v-list-item>

						<!-- Disabled System Tools -->
						<v-list-item v-for="toolName in disabledTools" :key="toolName" class="tool-item">
							<v-list-item-icon>
								<v-icon :name="toolOptions.get(toolName)?.icon ?? 'build'" small />
							</v-list-item-icon>
							<v-list-item-content>
								<div class="tool-row">
									<span v-tooltip="$t(`ai.tool_descriptions.${toolName}`)" class="tool-name">
										{{ formatTitle(toolName) }}
									</span>
									<v-select
										:model-value="aiStore.getToolApprovalMode(toolName)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(toolName, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(toolName)?.approval?.color }">
												<v-icon :name="toolOptions.get(toolName)?.approval?.icon" x-small />
												{{ toolOptions.get(toolName)?.approval?.text }}
											</div>
										</template>
									</v-select>
								</div>
							</v-list-item-content>
						</v-list-item>

						<!-- Disabled External Tools -->
						<v-list-item v-for="tool in disabledExternalTools" :key="tool.name" class="tool-item">
							<v-list-item-icon>
								<v-icon name="cloud" small />
							</v-list-item-icon>
							<v-list-item-content>
								<div class="tool-row">
									<div class="tool-info">
										<span v-tooltip="tool.description" class="tool-name">
											{{ getExternalToolDisplayName(tool.name) }}
										</span>
										<span class="server-name">{{ tool.serverName }}</span>
									</div>
									<v-select
										:model-value="aiStore.getToolApprovalMode(tool.name)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(tool.name, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(tool.name)?.approval?.color }">
												<v-icon :name="toolOptions.get(tool.name)?.approval?.icon" x-small />
												{{ toolOptions.get(tool.name)?.approval?.text }}
											</div>
										</template>
									</v-select>
								</div>
							</v-list-item-content>
						</v-list-item>
					</template>
				</v-list>
			</div>
		</v-menu>
	</div>
</template>

<style scoped>
.ai-settings-menu {
	display: inline-flex;
}

.settings-container {
	min-inline-size: 320px;
	max-inline-size: 400px;
	max-block-size: 400px;
	overflow-y: auto;
}

.search-header {
	position: sticky;
	inset-block-start: 0;
	z-index: 1;
	padding: 8px;
	background-color: var(--theme--popover--menu--background);
}

.section-title {
	font-weight: 600;
	font-size: 14px;
	color: var(--theme--foreground);
}

.tool-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	inline-size: 100%;
}

.tool-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-inline-size: 0;
}

.tool-name {
	font-size: 14px;
	color: var(--theme--foreground);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.server-name {
	font-size: 11px;
	color: var(--theme--foreground-subdued);
}

.tool-item :deep(.v-select) {
	--v-select-font-family: var(--theme--fonts--sans--font-family);
	min-inline-size: 100px;
}

.tool-item :deep(.inline-display > .v-icon) {
	display: none;
}

.approval-preview {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}
</style>
