<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type ToolApprovalMode, useAiStore } from '../stores/use-ai';
import { SystemTool } from '../types/system-tool';
import VButton from '@/components/v-button.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VSelect from '@/components/v-select/v-select.vue';

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

const toolOptions = computed(() => {
	const map = new Map<string, { icon: string; approval: (typeof approvalModeOptions.value)[0] }>();

	for (const tool of systemTools) {
		const mode = aiStore.getToolApprovalMode(tool);

		map.set(tool, {
			icon: toolIcons[tool] || 'build',
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
		<VMenu v-model="menuOpen" placement="top-start" show-arrow :close-on-content-click="false" full-height>
			<template #activator="{ toggle }">
				<VButton v-tooltip.left="$t('ai.settings')" x-small icon secondary @click="toggle">
					<VIcon name="settings" small />
				</VButton>
			</template>

			<div class="settings-container">
				<div class="search-header">
					<VInput v-model="searchQuery" :placeholder="$t('search')" small autofocus>
						<template #prepend>
							<VIcon name="search" small />
						</template>
					</VInput>
				</div>

				<VList>
					<!-- Enabled Tools -->
					<template v-if="enabledTools.length > 0">
						<VListItem class="tool-item section-header" disabled>
							<VListItemContent>
								<span class="section-title">{{ $t('ai.enabled_tools') }}</span>
							</VListItemContent>
						</VListItem>

						<VListItem v-for="toolName in enabledTools" :key="toolName" class="tool-item">
							<VListItemIcon>
								<VIcon :name="toolOptions.get(toolName)?.icon ?? 'build'" small />
							</VListItemIcon>
							<VListItemContent>
								<div class="tool-row">
									<span v-tooltip="$t(`ai.tool_descriptions.${toolName}`)" class="tool-name">
										{{ $t(`ai_tools.${toolName}`) }}
									</span>
									<VSelect
										:model-value="aiStore.getToolApprovalMode(toolName)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(toolName, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(toolName)?.approval?.color }">
												<VIcon :name="toolOptions.get(toolName)?.approval?.icon" x-small />
												{{ toolOptions.get(toolName)?.approval?.text }}
											</div>
										</template>
									</VSelect>
								</div>
							</VListItemContent>
						</VListItem>
					</template>

					<!-- Disabled Tools -->
					<template v-if="disabledTools.length > 0">
						<VDivider v-if="enabledTools.length > 0" />

						<VListItem class="tool-item section-header" disabled>
							<VListItemContent>
								<span class="section-title">{{ $t('ai.disabled_tools') }}</span>
							</VListItemContent>
						</VListItem>

						<VListItem v-for="toolName in disabledTools" :key="toolName" class="tool-item">
							<VListItemIcon>
								<VIcon :name="toolOptions.get(toolName)?.icon ?? 'build'" small />
							</VListItemIcon>
							<VListItemContent>
								<div class="tool-row">
									<span v-tooltip="$t(`ai.tool_descriptions.${toolName}`)" class="tool-name">
										{{ formatTitle(toolName) }}
									</span>
									<VSelect
										:model-value="aiStore.getToolApprovalMode(toolName)"
										:items="approvalModeOptions"
										item-icon="icon"
										item-color="color"
										inline
										@update:model-value="onApprovalModeChange(toolName, $event as ToolApprovalMode)"
									>
										<template #preview>
											<div class="approval-preview" :style="{ color: toolOptions.get(toolName)?.approval?.color }">
												<VIcon :name="toolOptions.get(toolName)?.approval?.icon" x-small />
												{{ toolOptions.get(toolName)?.approval?.text }}
											</div>
										</template>
									</VSelect>
								</div>
							</VListItemContent>
						</VListItem>
					</template>
				</VList>
			</div>
		</VMenu>
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
