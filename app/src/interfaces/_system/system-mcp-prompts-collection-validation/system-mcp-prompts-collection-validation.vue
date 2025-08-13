<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import SystemMcpPromptsCollectionValidationExisting from './system-mcp-prompts-collection-validation-existing.vue';
import SystemMcpPromptsCollectionValidationNew from './system-mcp-prompts-collection-validation-new.vue';

const formValues = inject('values', ref({ mcp_prompts_collection: null }));

const promptsCollection = computed(() => formValues.value.mcp_prompts_collection);
</script>

<template>
	<div>
		<SystemMcpPromptsCollectionValidationExisting v-if="promptsCollection" :prompts-collection="promptsCollection" />
		<SystemMcpPromptsCollectionValidationNew v-else />
	</div>
</template>
