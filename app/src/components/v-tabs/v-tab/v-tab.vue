<template>
	<v-list-item v-if="vertical" class="v-tab vertical" :active="active" :disabled="disabled" @click="onClick">
		<slot v-bind="{ active, toggle }" />
	</v-list-item>
	<div v-else class="v-tab horizontal" :class="{ active, disabled }" @click="onClick">
		<slot v-bind="{ active, toggle }" />
	</div>
</template>

<script lang="ts">
import { defineComponent, inject, ref } from '@vue/composition-api';
import { useGroupable } from '@/composables/groupable';

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
		const { active, toggle } = useGroupable({
			value: props.value,
			group: 'v-tabs',
		});

		const vertical = inject('v-tabs-vertical', ref(false));

		return { active, toggle, onClick, vertical };

		function onClick() {
			if (props.disabled === false) toggle();
		}
	},
});
</script>

<style>
body {
	--v-tab-color: var(--foreground-subdued);
	--v-tab-background-color: var(--background-page);
	--v-tab-color-active: var(--foreground-normal);
	--v-tab-background-color-active: var(--background-page);
}
</style>

<style lang="scss" scoped>
.v-tab.horizontal {
	transition: color var(--fast) var(--transition);
	color: var(--v-tab-color);
	font-weight: 500;
	font-size: 14px;
	background-color: var(--v-tab-background-color);

	&:hover,
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
