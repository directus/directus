<template>
	<div class="label type-label" :class="{ disabled: disabled }">
		<v-checkbox
			v-if="batchMode"
			:input-value="batchActive"
			:value="field.field"
			@change="$emit('toggle-batch', field)"
		/>
		<span @click="toggle">
			{{ field.name }}
			<v-icon class="required" sup name="star" v-if="field.schema && field.schema.is_nullable === false" />
			<v-icon v-if="!disabled" class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
		</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Field } from '@/types/';

export default defineComponent({
	props: {
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActive: {
			type: Boolean,
			default: false,
		},
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		toggle: {
			type: Function,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.label {
	position: relative;
	display: flex;
	width: max-content;
	margin-bottom: 8px;
	cursor: pointer;

	&.readonly {
		cursor: not-allowed;
	}

	.v-checkbox {
		height: 18px; // Don't push down label with normal icon height (24px)
		margin-right: 4px;
	}

	.required {
		--v-icon-color: var(--primary);

		margin-left: -3px;
	}

	.ctx-arrow {
		position: absolute;
		top: -3px;
		right: -20px;
		color: var(--foreground-subdued);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);

		&.active {
			opacity: 1;
		}
	}

	&:hover {
		.ctx-arrow {
			opacity: 1;
		}
	}
}
</style>
