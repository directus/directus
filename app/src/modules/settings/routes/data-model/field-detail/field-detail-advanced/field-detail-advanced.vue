<template>
	<div class="content">
		<field-detail-advanced-schema v-if="currentTab === 'schema'" :is-existing="isExisting" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FieldDetailAdvancedSchema from './field-detail-advanced-schema.vue';

export default defineComponent({
	components: { FieldDetailAdvancedSchema },
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
