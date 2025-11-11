<script setup lang="ts">
import { useCustomSelection } from '@directus/composables';
import { computed, toRefs } from 'vue';
import { getMinimalGridClass } from '@/utils/get-minimal-grid-class';

type Option = {
	text: string;
	value: string | number | boolean;
};

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		disabled?: boolean;
		choices?: Option[];

		allowOther?: boolean;
		width?: string;

		iconOn?: string;
		iconOff?: string;
		color?: string;
	}>(),
	{
		iconOn: 'radio_button_checked',
		iconOff: 'radio_button_unchecked',
		color: 'var(--theme--primary)',
	},
);

const emit = defineEmits(['input']);


const { choices, value } = toRefs(props);

const items = computed(() => choices.value || []);

const gridClass = computed(() => getMinimalGridClass(items.value, props.width));

const { otherValue, usesOtherValue } = useCustomSelection(value as any, items as any, (value) => emit('input', value));

const customIcon = computed(() => {
	if (!otherValue.value) return 'add';
	if (otherValue.value && usesOtherValue.value === true) return props.iconOn;
	return props.iconOff;
});
</script>

<template>
	<v-notice v-if="!items" type="warning">
		{{ $t('choices_option_configured_incorrectly') }}
	</v-notice>
	<div
		v-else
		class="radio-buttons"
		:class="gridClass"
		:style="{
			'--v-radio-color': color,
		}"
	>
		<v-radio
			v-for="item in items"
			:key="item.value"
			block
			:value="item.value"
			:label="item.text"
			:disabled="disabled"
			:icon-on="iconOn"
			:icon-off="iconOff"
			:model-value="value"
			@update:model-value="$emit('input', $event)"
		/>
		<v-notice v-if="items.length === 0 && !allowOther" type="info">
			{{ $t('no_options_available') }}
		</v-notice>
		<div
			v-if="allowOther"
			class="custom"
			:class="{
				active: !disabled && usesOtherValue,
				'has-value': !disabled && otherValue,
				disabled,
			}"
		>
			<v-icon
				:name="customIcon"
				class="radio-icon"
				:disabled="disabled"
				clickable
				@click="otherValue ? $emit('input', otherValue) : ($refs.customInput as HTMLInputElement).focus()"
			/>
			<input
				ref="customInput"
				v-model="otherValue"
				:placeholder="$t('other')"
				:disabled="disabled"
				@change="$emit('input', otherValue)"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.radio-buttons {
	--columns: 1;

	display: grid;
	gap: 12px 32px;
	grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
}

.grid-2 {
	@media (min-width: 600px) {
		--columns: 2;
	}
}

.grid-3 {
	@media (min-width: 600px) {
		--columns: 3;
	}
}

.grid-4 {
	@media (min-width: 600px) {
		--columns: 4;
	}
}

.custom {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);

	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	padding: 10px;
	border: var(--theme--border-width) dashed var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	input {
		display: block;
		flex-grow: 1;
		inline-size: 20px; /* this will auto grow with flex above */
		margin: 0;
		margin-inline-start: 8px;
		padding: 0;
		background-color: transparent;
		border: none;
		border-radius: 0;

		&::placeholder {
			color: var(--theme--form--field--input--foreground-subdued);
		}
	}

	&.has-value {
		--v-icon-color-hover: var(--v-icon-color);

		background-color: var(--theme--form--field--input--background-subdued);
		border: var(--theme--border-width) solid var(--theme--form--field--input--background-subdued);
	}

	&.active {
		--v-icon-color: var(--v-radio-color, var(--theme--primary));

		position: relative;
		background-color: transparent;
		border-color: var(--v-radio-color, var(--theme--primary));

		&::before {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 100%;
			block-size: 100%;
			background-color: var(--v-radio-color, var(--theme--primary));
			opacity: 0.1;
			content: '';
			pointer-events: none;
		}
	}

	&.disabled {
		background-color: var(--theme--form--field--input--background-subdued);
		border-color: transparent;
		cursor: not-allowed;

		input {
			color: var(--theme--form--field--input--foreground-subdued);
			cursor: not-allowed;

			&::placeholder {
				color: var(--theme--form--field--input--foreground-subdued);
			}
		}
	}
}
</style>
