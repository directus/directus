<template>
	<div class="content">
		<field-detail-advanced-schema v-if="currentTab === 'schema'" :is-existing="isExisting" />
		<field-detail-advanced-field v-if="currentTab === 'field'" :is-existing="isExisting" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';
import FieldDetailAdvancedField from './field-detail-advanced-field.vue';

export default defineComponent({
	components: { FieldDetailAdvancedSchema, FieldDetailAdvancedField },
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
