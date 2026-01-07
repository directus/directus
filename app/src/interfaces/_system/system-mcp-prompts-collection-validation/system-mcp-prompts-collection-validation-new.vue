<script lang="ts" setup>
import { ref } from 'vue';
import SystemMcpPromptsCollectionGenerateDialog from './system-mcp-prompts-collection-generate-dialog.vue';
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';

const generateCollectionDialogActive = ref(false);

defineEmits<{
	save: [value: string];
}>();
</script>

<template>
	<VNotice multiline indent-content>
		<template #title>{{ $t('mcp_prompts_collection.no_collection_selected') }}</template>

		<div class="notice-content">
			<p>{{ $t('mcp_prompts_collection.no_collection_selected_copy') }}</p>

			<VButton small outlined @click="generateCollectionDialogActive = true">
				{{ $t('mcp_prompts_collection.generate') }}
			</VButton>

			<SystemMcpPromptsCollectionGenerateDialog
				v-model:active="generateCollectionDialogActive"
				@save="$emit('save', $event)"
			/>
		</div>
	</VNotice>
</template>

<style scoped>
.notice-content {
	padding-block: 10px 4px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>
