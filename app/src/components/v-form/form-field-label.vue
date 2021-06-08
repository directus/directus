<template>
	<div class="label type-label" :class="{ disabled, edited: edited && !batchMode && !hasError }">
		<v-checkbox
			v-if="batchMode"
			:model-value="batchActive"
			:value="field.field"
			@update:model-value="$emit('toggle-batch', field)"
		/>
		<span @click="toggle" v-tooltip="edited ? t('edited') : null">
			{{ field.name }}
			<v-icon class="required" sup name="star" v-if="field.schema && field.schema.is_nullable === false" />
			<v-icon v-if="!disabled" class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
		</span>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { Field } from '@/types/';

export default defineComponent({
	emits: ['toggle-batch'],
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
		edited: {
			type: Boolean,
			default: false,
		},
		hasError: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const { t } = useI18n();
		return { t };
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

	&.edited {
		&::before {
			position: absolute;
			top: 7px;
			left: -7px;
			display: block;
			width: 4px;
			height: 4px;
			background-color: var(--foreground-subdued);
			border-radius: 4px;
			content: '';
			pointer-events: none;
		}

		> span {
			margin-left: -16px;
			padding-left: 16px;
		}
	}
}
</style>
