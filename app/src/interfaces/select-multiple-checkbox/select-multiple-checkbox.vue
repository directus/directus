<script setup lang="ts">
import { type OtherValue, useCustomSelectionMultiple } from '@directus/composables';
import { computed, ref, toRefs } from 'vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDetail from '@/components/v-detail.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { getMinimalGridClass } from '@/utils/get-minimal-grid-class';

type Option = {
	text: string;
	value: string | number | boolean;
	disabled?: boolean;
};

const props = withDefaults(
	defineProps<{
		value: string[] | null;
		disabled?: boolean;
		nonEditable?: boolean;
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
		color: 'var(--theme--primary)',
		itemsShown: 8,
	},
);

const emit = defineEmits(['input']);

const { choices, value } = toRefs(props);
const showAll = ref(false);

const items = computed(() => choices.value || []);

const hideChoices = computed(() => items.value.length > props.itemsShown);

const choicesDisplayed = computed(() => {
	if (showAll.value || hideChoices.value === false) {
		return items.value;
	}

	return items.value.slice(0, props.itemsShown);
});

const hiddenCount = computed(() => items.value!.length - props.itemsShown);

const gridClass = computed(() => getMinimalGridClass(items.value, props.width));

const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(value, items, (value) =>
	emit('input', value),
);

function onBlurCustomInput(otherVal: OtherValue) {
	return (otherVal.value === null || otherVal.value?.length === 0) && setOtherValue(otherVal.key, null);
}
</script>

<template>
	<div
		class="checkboxes"
		:class="gridClass"
		:style="{
			'--v-checkbox-color': color,
		}"
	>
		<VCheckbox
			v-for="item in choicesDisplayed"
			:key="item.value"
			block
			:value="item.value"
			:label="item.text"
			:disabled="item.disabled || disabled"
			:non-editable="nonEditable"
			:icon-on="iconOn"
			:icon-off="iconOff"
			:model-value="value || []"
			@update:model-value="$emit('input', $event)"
		/>
		<VDetail
			v-if="hideChoices && showAll === false"
			:class="gridClass"
			:label="$t(`interfaces.select-multiple-checkbox.show_more`, { count: hiddenCount })"
			:disabled
			@update:model-value="showAll = true"
		></VDetail>

		<VNotice v-if="items.length === 0 && !allowOther" type="info">
			{{ $t('no_options_available') }}
		</VNotice>

		<template v-if="allowOther">
			<VCheckbox
				v-for="otherValue in otherValues"
				:key="otherValue.key"
				block
				custom-value
				:autofocus-custom-input="otherValue.focus"
				:value="otherValue.value"
				:disabled="disabled"
				:non-editable="nonEditable"
				:icon-on="iconOn"
				:icon-off="iconOff"
				:model-value="value || []"
				@update:model-value="$emit('input', $event)"
				@update:value="setOtherValue(otherValue.key, $event)"
				@blur:custom-input="onBlurCustomInput(otherValue)"
			>
				<template v-if="!nonEditable" #append>
					<VIcon
						v-tooltip="!disabled && $t('remove_item')"
						name="delete"
						clickable
						:disabled
						@click="setOtherValue(otherValue.key, null)"
					/>
				</template>
			</VCheckbox>

			<button
				v-if="allowOther && !nonEditable"
				type="button"
				:disabled
				class="add-new custom"
				:class="{ disabled }"
				@click="addOtherValue('', true)"
			>
				<VIcon name="add" />
				{{ $t('other') }}
			</button>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.checkboxes {
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

.v-detail {
	margin-block: 0;

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
	--focus-ring-offset: var(--focus-ring-offset-invert);

	&.disabled {
		color: var(--theme--form--field--input--foreground-subdued);
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
	}

	&.has-value {
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
		cursor: not-allowed;

		&:not(.add-new) {
			border-color: transparent;
		}

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
