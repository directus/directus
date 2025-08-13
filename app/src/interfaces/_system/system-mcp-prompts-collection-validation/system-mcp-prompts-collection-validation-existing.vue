<script lang="ts" setup>
import { defineProps, toRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCollectionValidation } from './use-collection-validation';
import SystemMcpPromptsCollectionGenerateDialog from './system-mcp-prompts-collection-generate-dialog.vue';

const { t } = useI18n();

const props = defineProps<{
	promptsCollection: string;
}>();

const validationIssues = useCollectionValidation(toRef(() => props.promptsCollection));

const generateCollectionDialogActive = ref(false);
</script>

<template>
	<v-notice v-if="validationIssues.invalidFields.length > 0" multiline type="danger">
		<template #title>
			{{ t('mcp_prompts_collection.validation_error_invalid') }}
		</template>

		<div class="notice-content">
			<p>{{ t('mcp_prompts_collection.invalid_fields') }}</p>
			<ul>
				<li v-for="{ field } of validationIssues.invalidFields" :key="field" class="mono">{{ field }}</li>
			</ul>
		</div>
	</v-notice>

	<v-notice v-else-if="validationIssues.missingFields.length > 0" multiline type="danger">
		<template #title>
			{{ t('mcp_prompts_collection.validation_error_missing') }}
		</template>

		<div class="notice-content">
			<p>{{ t('mcp_prompts_collection.missing_fields') }}</p>
			<ul>
				<li v-for="{ field } of validationIssues.missingFields" :key="field" class="mono">{{ field }}</li>
			</ul>
			<v-button class="generate-button" small @click="generateCollectionDialogActive = true">
				{{ t('mcp_prompts_collection.generate_missing') }}
			</v-button>

			<SystemMcpPromptsCollectionGenerateDialog
				v-model:active="generateCollectionDialogActive"
				:fields="validationIssues.missingFields.map(({ field }) => field)"
				:collection="promptsCollection"
			/>
		</div>
	</v-notice>

	<v-notice v-else>
		{{ t('mcp_prompts_collection.validation_success') }}
	</v-notice>
</template>

<style scoped>
.notice-content {
	> * {
		margin-block-start: 10px;
	}
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
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
