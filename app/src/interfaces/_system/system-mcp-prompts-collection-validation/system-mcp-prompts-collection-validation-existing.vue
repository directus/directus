<script lang="ts" setup>
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';
import { ref, toRef } from 'vue';
import SystemMcpPromptsCollectionGenerateDialog from './system-mcp-prompts-collection-generate-dialog.vue';
import { useCollectionValidation } from './use-collection-validation';

const props = defineProps<{
	promptsCollection: string;
}>();

defineEmits<{
	save: [value: string];
}>();

const validationIssues = useCollectionValidation(toRef(() => props.promptsCollection));

const generateCollectionDialogActive = ref(false);
</script>

<template>
	<v-notice v-if="validationIssues.collectionNotFound" multiline indent-content type="danger">
		<template #title>
			{{ $t('mcp_prompts_collection.collection_not_found') }}
		</template>

		<div class="notice-content">
			<p>{{ $t('mcp_prompts_collection.collection_not_found_description', { collection: promptsCollection }) }}</p>
			<v-button small outlined danger @click="generateCollectionDialogActive = true">
				{{ $t('mcp_prompts_collection.generate') }}
			</v-button>

			<SystemMcpPromptsCollectionGenerateDialog
				v-model:active="generateCollectionDialogActive"
				@save="$emit('save', $event)"
			/>
		</div>
	</v-notice>

	<v-notice v-else-if="validationIssues.invalidFields.length > 0" multiline indent-content type="danger">
		<template #title>
			{{ $t('mcp_prompts_collection.validation_error_invalid') }}
		</template>

		<div class="notice-content">
			<p>{{ $t('mcp_prompts_collection.invalid_fields') }}</p>
			<ul>
				<li v-for="{ field } of validationIssues.invalidFields" :key="field" class="mono">{{ field }}</li>
			</ul>
		</div>
	</v-notice>

	<v-notice v-else-if="validationIssues.missingFields.length > 0" multiline indent-content type="danger">
		<template #title>
			{{ $t('mcp_prompts_collection.validation_error_missing') }}
		</template>

		<div class="notice-content">
			<p>{{ $t('mcp_prompts_collection.missing_fields') }}</p>
			<ul>
				<li v-for="{ field } of validationIssues.missingFields" :key="field" class="mono">{{ field }}</li>
			</ul>
			<v-button small outlined danger @click="generateCollectionDialogActive = true">
				{{ $t('mcp_prompts_collection.generate_missing') }}
			</v-button>

			<SystemMcpPromptsCollectionGenerateDialog
				v-model:active="generateCollectionDialogActive"
				:fields="validationIssues.missingFields.map(({ field }) => field)"
				:collection="promptsCollection"
			/>
		</div>
	</v-notice>

	<v-notice v-else type="success">
		<template #title>
			{{ $t('mcp_prompts_collection.validation_success') }}
		</template>
	</v-notice>
</template>

<style scoped>
.notice-content {
	padding-block: 10px 4px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
}
</style>
