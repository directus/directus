<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<div
		v-else
		class="checkboxes"
		:class="gridClass"
		:style="{
			'--v-checkbox-color': color,
		}"
	>
		<v-checkbox
			v-for="item in choicesDisplayed"
			:key="item.value"
			block
			:value="item.value"
			:label="item.text"
			:disabled="disabled"
			:icon-on="iconOn"
			:icon-off="iconOff"
			:model-value="value || []"
			@update:model-value="$emit('input', $event)"
		/>
		<v-detail
			v-if="hideChoices && showAll === false"
			:class="gridClass"
			:label="t(`interfaces.select-multiple-checkbox.show_more`, { count: hiddenCount })"
			@update:model-value="showAll = true"
		></v-detail>

		<template v-if="allowOther">
			<v-checkbox
				v-for="otherValue in otherValues"
				:key="otherValue.key"
				block
				custom-value
				:value="otherValue.value"
				:disabled="disabled"
				:icon-on="iconOn"
				:icon-off="iconOff"
				:model-value="value || []"
				@update:value="setOtherValue(otherValue.key, $event)"
				@update:model-value="$emit('input', $event)"
			/>

			<button
				v-if="allowOther"
				:disabled="disabled"
				class="add-new custom"
				align="left"
				outlined
				dashed
				secondary
				@click="addOtherValue()"
			>
				<v-icon name="add" />
				{{ t('other') }}
			</button>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useCustomSelectionMultiple } from '@directus/composables';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

type Option = {
	text: string;
	value: string | number | boolean;
};

const props = withDefaults(
	defineProps<{
		value: string[] | null;
		disabled?: boolean;
		choices: Option[];
		allowOther?: boolean;
		width?: string;
		iconOn?: string;
		iconOff?: string;
		color?: string;
		itemsShown?: number;
	}>(),
	{
		iconOn: 'check_box',
		iconOff: 'check_box_outline_blank',
		color: 'var(--primary)',
		itemsShown: 8,
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const { choices, value } = toRefs(props);
const showAll = ref(false);

const hideChoices = computed(() => props.choices!.length > props.itemsShown);

const choicesDisplayed = computed(() => {
	if (showAll.value || hideChoices.value === false) {
		return props.choices;
	}

	return props.choices!.slice(0, props.itemsShown);
});

const hiddenCount = computed(() => props.choices!.length - props.itemsShown);

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

const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(value, choices, (value) =>
	emit('input', value)
);
</script>

<style lang="scss" scoped>
.checkboxes {
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

.v-detail {
	margin-top: 0;
	margin-bottom: 0;

	&.grid-1 {
		grid-column: span 1;
	}

	&.grid-2 {
		grid-column: span 2;
	}

	&.grid-3 {
		grid-column: span 3;
	}

	&.grid-4 {
		grid-column: span 4;
	}
}

.add-new {
	--v-button-min-width: none;
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
