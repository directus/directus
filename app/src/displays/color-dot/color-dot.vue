<template>
	<div>
		<value-null v-if="value === null" />
		<div class="dot" :style="styles">{{ displayValue }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

type Choice = {
	value: string;
	text: string;
	color: string | null;
};

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		choices: {
			type: Array as PropType<Choice[]>,
			default: () => [],
		},
		defaultBackground: {
			type: String,
			default: '#eceff1',
		},
		defaultForeground: {
			type: String,
			default: '#263238',
		},
	},
	setup(props) {
		const currentChoice = computed(() => {
			return props.choices.find((choice) => {
				return choice.value === props.value;
			});
		});

		const displayValue = computed(() => {
			if (!currentChoice.value) return formatTitle(props.value);
			return currentChoice.value.text;
		});

		const styles = computed(() => {
			return {
				backgroundColor: currentChoice.value?.color || props.defaultForeground,
			};
		});

		return { displayValue, styles };
	},
});
</script>

<style lang="scss" scoped>
.dot {
	display: inline-block;
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	margin: 0 4px;
	vertical-align: middle;
	border-radius: 6px;
}
</style>
