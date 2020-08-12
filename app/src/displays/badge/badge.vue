<template>
	<div>
		<value-null v-if="value === null" />
		<div class="badge" :style="styles">{{ displayValue }}</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type Choice = {
	value: string;
	text: string;
	foreground: string | null;
	background: string | null;
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
			required: true,
		},
		defaultForeground: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const currentChoice = computed(() => {
			return props.choices.find((choice) => {
				return choice.value === props.value;
			});
		});

		const displayValue = computed(() => {
			if (!currentChoice.value) return props.value;
			return currentChoice.value.text;
		});

		const styles = computed(() => {
			return {
				color: currentChoice.value?.foreground || props.defaultForeground,
				backgroundColor: currentChoice.value?.background || props.defaultBackground,
			};
		});

		return { displayValue, styles };
	},
});
</script>

<style lang="scss" scoped>
.badge {
	display: inline-block;
	padding: 8px;
	line-height: 1;
	vertical-align: middle;
	border-radius: var(--border-radius);
}
</style>
