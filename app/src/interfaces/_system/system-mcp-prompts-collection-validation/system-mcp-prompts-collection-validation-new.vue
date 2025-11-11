<script lang="ts" setup>
import { ref } from 'vue';
import SystemMcpPromptsCollectionGenerateDialog from './system-mcp-prompts-collection-generate-dialog.vue';

const generateCollectionDialogActive = ref(false);

defineEmits<{
	save: [value: string];
}>();
</script>

<template>
	<v-notice multiline indent-content>
		<template #title>{{ $$t('mcp_prompts_collection.no_collection_selected') }}</template>

		<div class="notice-content">
			<p>{{ $$t('mcp_prompts_collection.no_collection_selected_copy') }}</p>

			<v-button small outlined @click="generateCollectionDialogActive = true">
				{{ $$t('mcp_prompts_collection.generate') }}
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
	padding-block: 10px 4px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
