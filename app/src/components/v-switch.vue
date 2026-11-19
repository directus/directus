<script setup lang="ts">
interface Props {
	/** Used to model the active state */
	modelValue?: boolean | null;
	/** Label for the switch */
	label?: string | null;
	/** Disable the switch */
	disabled?: boolean;
	/** Set the non-editable state for the switch */
	nonEditable?: boolean;
	/** Show as styled block. Matches input size */
	block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: null,
	disabled: false,
	nonEditable: false,
	block: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

function toggle() {
	if (props.disabled) return;
	emit('update:modelValue', !props.modelValue);
}
</script>

<template>
	<button
		type="button"
		role="switch"
		class="v-switch"
		:class="{ checked: modelValue === true, block, disabled, 'non-editable': nonEditable }"
		:aria-checked="modelValue === true"
		:disabled
		@click.stop="toggle"
	>
		<span class="track" aria-hidden="true"><span class="thumb" /></span>
		<span v-if="label || $slots.default" class="label type-text">
			<slot>{{ label }}</slot>
		</span>
	</button>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

/*

	Available Variables:

		--v-switch-color            [var(--theme--primary)]
		--v-switch-unchecked-color  [var(--theme--form--field--input--border-color)]
		--v-switch-thumb-color      [var(--white)]

*/

.v-switch {
	--v-switch-track-inline-size: 2.5rem;
	--v-switch-track-block-size: 1.375rem;
	--v-switch-thumb-inset: 0.1875rem;
	--v-switch-thumb-size: calc(var(--v-switch-track-block-size) - 2 * var(--v-switch-thumb-inset));

	position: relative;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0;
	text-align: start;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;
	cursor: pointer;

	.track {
		position: relative;
		flex-shrink: 0;
		inline-size: var(--v-switch-track-inline-size);
		block-size: var(--v-switch-track-block-size);
		background-color: var(--v-switch-unchecked-color, var(--theme--form--field--input--border-color));
		border-radius: calc(var(--v-switch-track-block-size) / 2);
		transition: background-color var(--fast) var(--transition);
	}

	.thumb {
		position: absolute;
		inset-block-start: var(--v-switch-thumb-inset);
		inset-inline-start: var(--v-switch-thumb-inset);
		inline-size: var(--v-switch-thumb-size);
		block-size: var(--v-switch-thumb-size);
		background-color: var(--v-switch-thumb-color, var(--white));
		border-radius: 50%;
		transition: inset-inline-start var(--fast) var(--transition);
	}

	.label {
		flex-grow: 1;
		color: var(--theme--foreground);
		transition: color var(--fast) var(--transition);
		@include mixins.no-wrap;
	}

	&.checked {
		.track {
			background-color: var(--v-switch-color, var(--theme--primary));
		}

		.thumb {
			inset-inline-start: calc(
				var(--v-switch-track-inline-size) - var(--v-switch-thumb-size) - var(--v-switch-thumb-inset)
			);
		}
	}

	&:not(.disabled):hover .track {
		background-color: var(--theme--form--field--input--border-color-hover);
	}

	&.checked:not(.disabled):hover .track {
		background-color: var(--v-switch-color, var(--theme--primary));
	}

	&.disabled {
		cursor: not-allowed;

		&:not(.non-editable) {
			.track {
				opacity: 0.5;
			}

			.label {
				color: var(--theme--foreground-subdued);
			}
		}
	}

	&.block {
		--focus-ring-offset: var(--focus-ring-offset-invert);

		inline-size: 100%;
		block-size: var(--theme--form--field--input--height);
		padding: 0.5625rem 0.875rem;
		background-color: var(--theme--form--field--input--background);
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
		transition: border-color var(--fast) var(--transition);

		&.disabled:not(.non-editable) {
			background-color: var(--theme--form--field--input--background-subdued);
		}

		&:not(.disabled):hover {
			border-color: var(--theme--form--field--input--border-color-hover);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.track,
		.thumb {
			transition: none;
		}
	}
}
</style>
