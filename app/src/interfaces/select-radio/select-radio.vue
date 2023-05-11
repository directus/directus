<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
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
			v-for="item in choices"
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
		<div
			v-if="allowOther"
			class="custom"
			:class="{
				active: !disabled && usesOtherValue,
				'has-value': !disabled && otherValue,
				disabled,
			}"
		>
			<v-icon :disabled="disabled" :name="customIcon" clickable @click="$emit('input', otherValue)" />
			<input v-model="otherValue" :placeholder="t('other')" :disabled="disabled" @focus="$emit('input', otherValue)" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useCustomSelection } from '@directus/composables';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

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
		color: 'var(--primary)',
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const { choices, value } = toRefs(props);

const gridClass = computed(() => {
	if (choices?.value === undefined) return null;

	const widestOptionLength = choices.value.reduce((acc, val) => {
		if (val.text.length > acc.length) acc = val.text;
		return acc;
	}, '').length;

	if (props.width?.startsWith('half')) {
		if (widestOptionLength <= 10) return 'grid-2';
		return 'grid-1';
	}

	if (widestOptionLength <= 10) return 'grid-4';
	if (widestOptionLength > 10 && widestOptionLength <= 15) return 'grid-3';
	if (widestOptionLength > 15 && widestOptionLength <= 25) return 'grid-2';
	return 'grid-1';
});

const { otherValue, usesOtherValue } = useCustomSelection(value as any, choices as any, (value) =>
	emit('input', value)
);

const customIcon = computed(() => {
	if (!otherValue.value) return 'add';
	if (otherValue.value && usesOtherValue.value === true) return props.iconOn;
	return props.iconOff;
});
</script>

<style lang="scss" scoped>
.radio-buttons {
	--columns: 1;

	display: grid;
	grid-gap: 12px 32px;
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
	--v-icon-color: var(--foreground-subdued);

	display: flex;
	align-items: center;
	width: 100%;
	height: var(--input-height);
	padding: 10px;
	border: 2px dashed var(--border-normal);
	border-radius: var(--border-radius);

	input {
		display: block;
		flex-grow: 1;
		width: 20px; /* this will auto grow with flex above */
		margin: 0;
		margin-left: 8px;
		padding: 0;
		background-color: transparent;
		border: none;
		border-radius: 0;

		&::placeholder {
			color: var(--foreground-subdued);
		}
	}

	&.has-value {
		background-color: var(--background-subdued);
		border: 2px solid var(--background-subdued);
	}

	&.active {
		--v-icon-color: var(--v-radio-color);

		position: relative;
		background-color: transparent;
		border-color: var(--v-radio-color);

		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--v-radio-color);
			opacity: 0.1;
			content: '';
			pointer-events: none;
		}
	}

	&.disabled {
		background-color: var(--background-subdued);
		border-color: transparent;
		cursor: not-allowed;

		input {
			color: var(--foreground-subdued);
			cursor: not-allowed;

			&::placeholder {
				color: var(--foreground-subdued);
			}
		}
	}
}
</style>
