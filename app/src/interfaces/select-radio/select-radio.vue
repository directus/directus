<script setup lang="ts">
import { useCustomSelection } from '@directus/composables';
import { computed, toRefs } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import VRadio from '@/components/v-radio.vue';
import { getMinimalGridClass } from '@/utils/get-minimal-grid-class';

type Option = {
	text: string;
	value: string | number | boolean;
};

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		disabled?: boolean;
		nonEditable?: boolean;
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
	<VNotice v-if="!items" type="warning">
		{{ $t('choices_option_configured_incorrectly') }}
	</VNotice>
	<div
		v-else
		class="radio-buttons"
		:class="gridClass"
		:style="{
			'--v-radio-color': color,
		}"
	>
		<VRadio
			v-for="item in items"
			:key="item.value"
			block
			:value="item.value"
			:label="item.text"
			:disabled="disabled"
			:non-editable="nonEditable"
			:icon-on="iconOn"
			:icon-off="iconOff"
			:model-value="value"
			@update:model-value="$emit('input', $event)"
		/>
		<VNotice v-if="items.length === 0 && !allowOther" type="info">
			{{ $t('no_options_available') }}
		</VNotice>
		<div
			v-if="allowOther && !(nonEditable && !usesOtherValue && !otherValue)"
			class="custom"
			:class="{
				active: (!disabled || nonEditable) && usesOtherValue,
				'has-value': otherValue,
				disabled,
				'non-editable': nonEditable,
			}"
		>
			<VIcon
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
	@media (width > 640px) {
		--columns: 2;
	}
}

.grid-3 {
	@media (width > 640px) {
		--columns: 3;
	}
}

.grid-4 {
	@media (width > 640px) {
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
		cursor: not-allowed;

		input,
		.radio-icon {
			cursor: not-allowed;
		}
	}

	&.disabled:not(.non-editable) {
		background-color: var(--theme--form--field--input--background-subdued);

		&.has-value {
			border-color: var(--theme--form--field--input--border-color);
		}

		input {
			color: var(--theme--form--field--input--foreground-subdued);

			&::placeholder {
				color: var(--theme--form--field--input--foreground-subdued);
			}
		}
	}
}
</style>
