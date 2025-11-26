<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiStore, type ToolApprovalMode } from '../stores/use-ai';
import { SystemTool } from '../types/system-tool';
import formatTitle from '@directus/format-title';

const { t } = useI18n();
const aiStore = useAiStore();

const menuOpen = ref(false);
const searchQuery = ref('');

watch(menuOpen, (open) => {
	if (!open) searchQuery.value = '';
});

const systemTools = aiStore.systemTools;

const filterBySearch = (tools: string[]) => {
	if (!searchQuery.value) return tools;
	const query = searchQuery.value.toLowerCase();
	return tools.filter((tool) => formatTitle(tool).toLowerCase().includes(query));
};

const enabledTools = computed(() =>
	filterBySearch(systemTools.filter((t) => aiStore.getToolApprovalMode(t) !== 'disabled')),
);

const disabledTools = computed(() =>
	filterBySearch(systemTools.filter((t) => aiStore.getToolApprovalMode(t) === 'disabled')),
);

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

function getToolIcon(toolName: SystemTool): string {
	return toolIcons[toolName] || 'build';
}

function onApprovalModeChange(toolName: string, mode: ToolApprovalMode) {
	aiStore.setToolApprovalMode(toolName, mode);
}
</script>

<template>
	<div class="ai-settings-menu">
		<v-menu v-model="menuOpen" placement="top-start" show-arrow :close-on-content-click="false">
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
					<!-- Enabled Tools -->
					<template v-if="enabledTools.length > 0">
						<v-list-item class="tool-item section-header" disabled>
							<v-list-item-content>
								<span class="section-title">{{ $t('ai.enabled_tools') }}</span>
							</v-list-item-content>
						</v-list-item>

						<v-list-item v-for="toolName in enabledTools" :key="toolName" class="tool-item">
							<v-list-item-icon>
								<v-icon :name="getToolIcon(toolName)" small />
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
											<div
												class="approval-preview"
												:style="{
													color: approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))
														?.color,
												}"
											>
												<v-icon
													:name="
														approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))?.icon
													"
													x-small
												/>
												{{ approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))?.text }}
											</div>
										</template>
									</v-select>
								</div>
							</v-list-item-content>
						</v-list-item>
					</template>

					<!-- Disabled Tools -->
					<template v-if="disabledTools.length > 0">
						<v-divider v-if="enabledTools.length > 0" />

						<v-list-item class="tool-item section-header" disabled>
							<v-list-item-content>
								<span class="section-title">{{ $t('ai.disabled_tools') }}</span>
							</v-list-item-content>
						</v-list-item>

						<v-list-item v-for="toolName in disabledTools" :key="toolName" class="tool-item">
							<v-list-item-icon>
								<v-icon :name="getToolIcon(toolName)" small />
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
											<div
												class="approval-preview"
												:style="{
													color: approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))
														?.color,
												}"
											>
												<v-icon
													:name="
														approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))?.icon
													"
													x-small
												/>
												{{ approvalModeOptions.find((o) => o.value === aiStore.getToolApprovalMode(toolName))?.text }}
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
	display: flex;
	flex-direction: column;
	min-inline-size: 320px;
	max-inline-size: 400px;
	max-block-size: 400px;
	overflow: hidden;
}

.search-header {
	padding: 8px;
}

.settings-container :deep(.v-list) {
	overflow-y: auto;
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

.tool-name {
	font-size: 14px;
	color: var(--theme--foreground);
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
