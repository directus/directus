<template>
	<v-notice v-if="!choices" type="warning">
		{{ $t('choices_option_configured_incorrectly') }}
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
			block
			v-for="item in choicesDisplayed"
			:key="item.value"
			:value="item.value"
			:label="item.text"
			:disabled="disabled"
			:icon-on="iconOn"
			:icon-off="iconOff"
			:input-value="value || []"
			@change="$emit('input', $event)"
		/>
		<v-detail
			v-if="hideChoices && showAll === false"
			:class="gridClass"
			:label="$t(`interfaces.checkboxes.show_more`, { count: hiddenCount })"
			@toggle="showAll = true"
		></v-detail>

		<template v-if="allowOther">
			<v-checkbox
				block
				custom-value
				v-for="otherValue in otherValues"
				:key="otherValue.key"
				:value="otherValue.value"
				:disabled="disabled"
				:icon-on="iconOn"
				:icon-off="iconOff"
				:input-value="value || []"
				@update:value="setOtherValue(otherValue.key, $event)"
				@change="$emit('input', $event)"
			/>

			<button
				:disabled="disabled"
				v-if="allowOther"
				class="add-new custom"
				align="left"
				outlined
				dashed
				secondary
				@click="addOtherValue()"
			>
				<v-icon name="add" />
				{{ $t('other') }}
			</button>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, PropType, ref } from '@vue/composition-api';
import { useCustomSelectionMultiple } from '@/composables/use-custom-selection';

type Option = {
	text: string;
	value: string | number | boolean;
};

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<string[]>,
			default: null,
		},
		choices: {
			type: Array as PropType<Option[]>,
			default: null,
		},
		allowOther: {
			type: Boolean,
			default: false,
		},
		width: {
			type: String,
			default: null,
		},
		iconOn: {
			type: String,
			default: 'check_box',
		},
		iconOff: {
			type: String,
			default: 'check_box_outline_blank',
		},
		color: {
			type: String,
			default: 'var(--primary)',
		},
		itemsShown: {
			type: Number,
			default: 8,
		},
	},
	setup(props, { emit }) {
		const { choices, value } = toRefs(props);
		const showAll = ref(false);

		const hideChoices = computed(() => props.choices.length > props.itemsShown);

		const choicesDisplayed = computed(() => {
			if (showAll.value || hideChoices.value === false) {
				return props.choices;
			}
			return props.choices.slice(0, props.itemsShown);
		});

		const hiddenCount = computed(() => props.choices.length - props.itemsShown);

		const gridClass = computed(() => {
			if (choices.value === null) return null;

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

		const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(value, choices, emit);

		return {
			gridClass,
			otherValues,
			addOtherValue,
			setOtherValue,
			choicesDisplayed,
			hideChoices,
			showAll,
			hiddenCount,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.checkboxes {
	--columns: 1;

	display: grid;
	grid-gap: 12px 32px;
	grid-template-columns: repeat(var(--columns), 1fr);
}

.grid-2 {
	@include breakpoint(small) {
		--columns: 2;
	}
}

.grid-3 {
	@include breakpoint(small) {
		--columns: 3;
	}
}

.grid-4 {
	@include breakpoint(small) {
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
		width: 20px; // this will auto grow with flex above
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
