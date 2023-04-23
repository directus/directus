<template>
	<div class="content">
		<field-detail-advanced-schema v-if="currentTab === 'schema'" />
		<field-detail-advanced-relationship v-if="currentTab === 'relationship'" />
		<field-detail-advanced-field v-if="currentTab === 'field'" />
		<field-detail-advanced-interface v-if="currentTab === 'interface'" />
		<field-detail-advanced-display v-if="currentTab === 'display'" />
		<field-detail-advanced-validation v-if="currentTab === 'validation'" />
		<field-detail-advanced-conditions v-if="currentTab === 'conditions'" />
	</div>
</template>

<script setup lang="ts">
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';
import FieldDetailAdvancedRelationship from './field-detail-advanced-relationship.vue';
import FieldDetailAdvancedField from './field-detail-advanced-field.vue';
import FieldDetailAdvancedInterface from './field-detail-advanced-interface.vue';
import FieldDetailAdvancedDisplay from './field-detail-advanced-display.vue';
import FieldDetailAdvancedValidation from './field-detail-advanced-validation.vue';
import FieldDetailAdvancedConditions from './field-detail-advanced-conditions.vue';

defineProps<{
	currentTab: string;
}>();
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}
</style>
