<template>
	<div class="content">
		<field-detail-advanced-schema v-if="currentTab === 'schema'" :is-existing="isExisting" />
		<field-detail-advanced-field v-if="currentTab === 'field'" :is-existing="isExisting" />
		<field-detail-advanced-interface v-if="currentTab === 'interface'" :is-existing="isExisting" />
		<field-detail-advanced-display v-if="currentTab === 'display'" :is-existing="isExisting" />
		<field-detail-advanced-conditions v-if="currentTab === 'conditions'" :is-existing="isExisting" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';
import FieldDetailAdvancedField from './field-detail-advanced-field.vue';
import FieldDetailAdvancedInterface from './field-detail-advanced-interface.vue';
import FieldDetailAdvancedDisplay from './field-detail-advanced-display.vue';
import FieldDetailAdvancedConditions from './field-detail-advanced-conditions.vue';

export default defineComponent({
	components: {
		FieldDetailAdvancedSchema,
		FieldDetailAdvancedField,
		FieldDetailAdvancedInterface,
		FieldDetailAdvancedDisplay,
		FieldDetailAdvancedConditions,
	},
	props: {
		currentTab: {
			type: String,
			required: true,
		},
		isExisting: {
			type: Boolean,
			required: true,
		},
	},
});
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}
</style>
