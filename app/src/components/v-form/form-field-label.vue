<template>
	<div class="field-label type-label" :class="{ disabled, edited: edited && !batchMode && !hasError && !loading }">
		<v-checkbox
			v-if="batchMode"
			:model-value="batchActive"
			:value="field.field"
			@update:model-value="$emit('toggle-batch', field)"
		/>
		<span class="field-name" @click="toggle">
			<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
			<v-text-overflow :text="field.name" />
			<v-icon v-if="field.meta?.required === true" class="required" :class="{ 'has-badge': badge }" sup name="star" />
			<v-chip v-if="badge" x-small>{{ badge }}</v-chip>
			<v-icon v-if="!disabled" class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
		</span>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';

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
		edited: {
			type: Boolean,
			default: false,
		},
		hasError: {
			type: Boolean,
			default: false,
		},
		badge: {
			type: String,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle-batch'],
	setup() {
		const { t } = useI18n();

		return { t };
	},
});
</script>

<style lang="scss" scoped>
.field-label {
	position: relative;
	display: flex;
	margin-bottom: 8px;
	cursor: pointer;

	.v-text-overflow {
		display: inline;
		white-space: normal;
	}

	&.readonly {
		cursor: not-allowed;
	}

	.v-checkbox {
		height: 18px; // Don't push down label with normal icon height (24px)
		margin-right: 4px;
	}

	.v-chip {
		margin: 0;
		flex-shrink: 0;
		margin-left: 3px;
	}

	.required {
		--v-icon-color: var(--primary);

		margin-left: 3px;

		&.has-badge {
			margin-right: 6px;
		}
	}

	.ctx-arrow {
		margin-top: -3px;
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
		.edit-dot {
			position: absolute;
			top: 7px;
			left: -7px;
			display: block;
			width: 4px;
			height: 4px;
			background-color: var(--foreground-subdued);
			border-radius: 4px;
			content: '';
		}

		.field-name {
			margin-left: -16px;
			padding-left: 16px;
		}
	}

	@media (min-width: 960px) {
		display: block;

		.v-text-overflow {
			display: initial;
			white-space: nowrap;
		}

		.field-name {
			display: flex;
		}
	}
}
</style>
