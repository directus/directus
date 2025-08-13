<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SystemMcpPromptsCollectionGenerateDialog from './system-mcp-prompts-collection-generate-dialog.vue';

const { t } = useI18n();

const generateCollectionDialogActive = ref(false);

defineEmits<{
	save: [value: string];
}>();
</script>

<template>
	<v-notice multiline>
		<template #title>{{ t('mcp_prompts_collection.no_collection_selected') }}</template>

		<div class="notice-content">
			<p>{{ t('mcp_prompts_collection.no_collection_selected_copy') }}</p>

			<v-button class="generate-button" small @click="generateCollectionDialogActive = true">
				{{ t('mcp_prompts_collection.generate') }}
			</v-button>

			<SystemMcpPromptsCollectionGenerateDialog
				v-model:active="generateCollectionDialogActive"
				@save="$emit('save', $event)"
			/>
		</div>
	</v-notice>
</template>

<style scoped>
.notice-content {
	> * {
		margin-block-start: 10px;
	}
}

.generate-button {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
	--v-button-background-color: var(--theme--background-accent);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-button-background-color-active: var(--theme--background-accent);
}
</style>
