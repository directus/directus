<script setup lang="ts">
import { isDateUpdated, isUserUpdated } from '@/utils/field-utils';
import type { Field } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ComparisonContext, FormField } from '../types';
import VCheckbox from '@/components/v-checkbox.vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { CollabUser } from '@/composables/use-collab';
import HeaderCollab from '@/views/private/components/header-collab.vue';

const props = withDefaults(
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
		disabledMenu?: boolean;
		comparison?: ComparisonContext;
		comparisonActive?: boolean;
		focusedBy?: CollabUser;
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
		disabledMenu: false,
	},
);

defineEmits(['toggle-batch', 'toggle-raw']);

const { t } = useI18n();

const showHiddenIndicator = computed(
	() =>
		(props.comparison?.fields?.has(props.field.field) || props.comparison?.revisionFields?.has(props.field.field)) &&
		props.field.meta?.hidden,
);

function getUpdatedInRevisionTooltip(isDifferentFromLatest: boolean) {
	const isAutoUpdatedField = isDateUpdated(props.field as Field) || isUserUpdated(props.field as Field);

	if (isDifferentFromLatest || isAutoUpdatedField) return t('updated_in_revision');
	return t('updated_in_revision_matches_latest');
}
</script>

<template>
	<div class="field-label type-label" :class="{ disabled, edited: edited && !batchMode && !hasError && !loading }">
		<component
			:is="disabledMenu ? 'div' : 'button'"
			class="field-name"
			v-bind="!disabledMenu ? { type: 'button', onClick: toggle } : {}"
		>
			<span v-if="edited" v-tooltip="$t('edited')" class="edit-dot" />
			<VCheckbox
				v-if="batchMode"
				:model-value="batchActive"
				:value="field.field"
				@update:model-value="$emit('toggle-batch', field)"
			/>

			<VCheckbox
				v-if="comparison?.side === 'incoming' && comparison.fields.has(field.field)"
				class="comparison-checkbox"
				:model-value="comparisonActive"
				:value="field.field"
				@update:model-value="comparison.onToggleField(field.field)"
			/>

			<div class="field-label-content">
				<VTextOverflow :text="field.name" />

				<span v-if="showHiddenIndicator" class="hidden-indicator">({{ $t('hidden') }})</span>

				<VIcon
					v-if="field.meta?.required === true"
					class="required"
					:class="{ 'has-badge': badge }"
					sup
					name="star"
					filled
				/>

				<VChip v-if="badge" class="badge" x-small>{{ badge }}</VChip>

				<VIcon
					v-if="!disabled && rawEditorEnabled"
					v-tooltip="$t('toggle_raw_editor')"
					class="raw-editor-toggle"
					:class="{ active: rawEditorActive }"
					name="data_object"
					:filled="!rawEditorActive"
					small
					clickable
					@click.stop="$emit('toggle-raw', !rawEditorActive)"
				/>

				<VChip
					v-if="comparison?.side === 'incoming' && comparison.revisionFields?.has(field.field)"
					v-tooltip="getUpdatedInRevisionTooltip(comparison.fields.has(field.field))"
					class="updated-badge"
					x-small
					:label="false"
				>
					{{ $t('updated') }}
				</VChip>
			</div>

			<VIcon v-if="!disabled && !disabledMenu" class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
		</component>
		<HeaderCollab :model-value="focusedBy" hide-current lock x-small />
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

		@media (min-width: 960px) {
			display: initial;
			white-space: nowrap;
		}
	}

	&.readonly button {
		cursor: not-allowed;
	}

	.v-checkbox {
		block-size: 18px; // Don't push down label with normal icon height (24px)
		margin-inline-end: 4px;
		display: inline-flex;
		align-self: baseline;
	}

	.v-checkbox.comparison-checkbox {
		--v-checkbox-color: var(--theme--success);

		margin-inline-end: 8px;

		:deep(.checkbox) {
			&:hover {
				--v-icon-color: var(--theme--success);
			}
		}
	}

	.field-label-content {
		display: inline;

		@media (min-width: 960px) {
			display: contents;
		}
	}

	.badge {
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

	.hidden-indicator {
		margin-inline-start: 0.25em;
		color: var(--theme--foreground-subdued);
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

	.updated-badge {
		--v-chip-background-color: var(--theme--success-background);
		--v-chip-color: var(--theme--success-accent);

		flex-shrink: 0;
		margin-inline-start: 6px;
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

	.field-name {
		max-inline-size: 100%;
		text-align: start;
		display: flex;
		flex-wrap: nowrap;
	}
}

.type-label {
	font-family: var(--theme--form--field--label--font-family);
}

:deep(.header-collab) {
	position: absolute;
	inset-block-end: 0;
	inset-inline-end: 0;
}
</style>
