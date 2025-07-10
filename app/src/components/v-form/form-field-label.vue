<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { FormField } from './types';

withDefaults(
	defineProps<{
		field: FormField;
		toggle: (event: Event) => any;
		batchMode?: boolean;
		batchActive?: boolean;
		disabled?: boolean;
		active?: boolean;
		edited?: boolean;
		hasError?: boolean;
		badge?: string | null;
		loading?: boolean;
		rawEditorEnabled?: boolean;
		rawEditorActive?: boolean;
	}>(),
	{
		batchMode: false,
		batchActive: false,
		disabled: false,
		active: false,
		edited: false,
		hasError: false,
		badge: null,
		loading: false,
		rawEditorEnabled: false,
		rawEditorActive: false,
	},
);

defineEmits(['toggle-batch', 'toggle-raw']);

const { t } = useI18n();
</script>

<template>
	<div class="field-label type-label" :class="{ disabled, edited: edited && !batchMode && !hasError && !loading }">
		<button type="button" class="field-name" @click="toggle">
			<v-checkbox
				v-if="batchMode"
				:model-value="batchActive"
				:value="field.field"
				@update:model-value="$emit('toggle-batch', field)"
			/>
			<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
			<v-text-overflow :text="field.name" />
			<v-icon
				v-if="field.meta?.required === true"
				class="required"
				:class="{ 'has-badge': badge }"
				sup
				name="star"
				filled
			/>
			<v-chip v-if="badge" x-small>{{ badge }}</v-chip>
			<v-icon
				v-if="!disabled && rawEditorEnabled"
				v-tooltip="t('toggle_raw_editor')"
				class="raw-editor-toggle"
				:class="{ active: rawEditorActive }"
				name="data_object"
				:filled="!rawEditorActive"
				small
				clickable
				@click.stop="$emit('toggle-raw', !rawEditorActive)"
			/>
			<v-icon v-if="!disabled" class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
		</button>
	</div>
</template>

<style lang="scss" scoped>
.field-label {
	position: relative;
	display: flex;
	margin-block-end: 8px;
	color: var(--theme--form--field--label--foreground);

	.v-text-overflow {
		display: inline;
		white-space: normal;
	}

	&.readonly button {
		cursor: not-allowed;
	}

	.v-checkbox {
		block-size: 18px; // Don't push down label with normal icon height (24px)
		margin-inline-end: 4px;
	}

	.v-chip {
		margin: 0;
		flex-shrink: 0;
		margin-inline-start: 3px;
	}

	.required {
		--v-icon-color: var(--theme--primary);

		margin-inline-start: 3px;

		&.has-badge {
			margin-inline-end: 6px;
		}
	}

	.ctx-arrow {
		margin-block-start: -3px;
		color: var(--theme--foreground-subdued);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);

		&.active {
			opacity: 1;
		}
	}

	&:focus-within,
	&:hover {
		.ctx-arrow {
			opacity: 1;
		}
	}

	.raw-editor-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		block-size: 24px;
		inline-size: 24px;
		margin-block-start: -2px;
		margin-inline-start: 5px;
		color: var(--theme--foreground-subdued);
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}

		&.active {
			color: var(--theme--primary);
			background-color: var(--theme--primary-background);
			border-radius: 50%;
		}
	}

	&.edited {
		.edit-dot {
			position: absolute;
			inset-block-start: 7px;
			inset-inline-start: -7px;
			display: block;
			inline-size: 4px;
			block-size: 4px;
			background-color: var(--theme--foreground-subdued);
			border-radius: 4px;
			content: '';
		}

		.field-name {
			margin-inline-start: -16px;
			padding-inline-start: 16px;
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

.type-label {
	font-family: var(--theme--form--field--label--font-family);
}
</style>
