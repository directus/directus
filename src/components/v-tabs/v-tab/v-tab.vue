<template>
	<div class="v-tab" :class="{ active, disabled }" @click="onClick">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGroupable } from '@/compositions/groupable';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable(props.value);
		return { active, toggle, onClick };

		function onClick() {
			if (props.disabled === false) toggle();
		}
	},
});
</script>

<style lang="scss" scoped>
.v-tab {
	--v-tab-color: var(--input-foreground-color);
	--v-tab-background-color: var(--input-background-color);
	--v-tab-color-active: var(--input-foreground-color);
	--v-tab-background-color-active: var(--input-background-color);

	color: var(--v-tab-color);
	font-weight: 500;
	font-size: 12px;
	text-transform: uppercase;
	background-color: var(--v-tab-background-color);

	&.active {
		color: var(--v-tab-color-active);
		background-color: var(--v-tab-background-color-active);
	}

	&.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
}
</style>
