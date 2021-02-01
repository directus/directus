<template>
	<div class="form">
		<v-divider />
		<v-form :disabled="disabled" :fields="fields" :edits="value" primary-key="+" @input="$emit('input', $event)" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Field } from '@/types';

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: null,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles.scss';

.form {
	--form-vertical-gap: 24px;
	--form-horizontal-gap: 24px;

	padding: 12px;
	padding-top: 0;

	::v-deep .type-label {
		font-weight: 600;
		@include type-text;
	}
}

.v-divider {
	margin-bottom: 12px;
}
</style>
