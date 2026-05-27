<script setup lang="ts">
import FieldDetailAdvancedConditions from './field-detail-advanced-conditions.vue';
import FieldDetailAdvancedDisplay from './field-detail-advanced-display.vue';
import FieldDetailAdvancedField from './field-detail-advanced-field.vue';
import FieldDetailAdvancedInterface from './field-detail-advanced-interface.vue';
import FieldDetailAdvancedRelationship from './field-detail-advanced-relationship.vue';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';
import FieldDetailAdvancedValidation from './field-detail-advanced-validation.vue';

defineProps<{
	currentTab: string;
}>();
</script>

<template>
	<div class="content">
		<FieldDetailAdvancedSchema v-if="currentTab === 'schema'" />
		<FieldDetailAdvancedRelationship v-if="currentTab === 'relationship'" />
		<FieldDetailAdvancedField v-if="currentTab === 'field'" />
		<FieldDetailAdvancedInterface v-if="currentTab === 'interface'" />
		<FieldDetailAdvancedDisplay v-if="currentTab === 'display'" />
		<FieldDetailAdvancedValidation v-if="currentTab === 'validation'" />
		<FieldDetailAdvancedConditions v-if="currentTab === 'conditions'" />
	</div>
</template>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
