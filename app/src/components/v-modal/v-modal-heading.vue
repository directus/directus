<template>
	<div class="v-modal-heading">
		<div class="type-title">{{ heading }}</div>
		<div v-if="subheading" class="subheading">{{ subheading }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		heading: {
			type: String,
			required: true,
		},
		subheading: {
			type: String,
			default: null,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-modal-heading {
	margin-bottom: 48px;

	.subheading {
		margin-top: 4px;
		color: var(--foreground-subdued);
	}
}
</style>
