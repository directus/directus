<template>
	<div class="variable" :class="{ 'show-header': showHeader }">
		<component
			:is="`interface-${inter}`"
			v-bind="options"
			:value="value"
			:width="fieldWidth"
			:type="type"
			:field="field"
			@input="value = $event"
		/>
	</div>
</template>

<script setup lang="ts">
import { Type } from '@directus/types';
import { computed } from 'vue';
import { useInsightsStore } from '@/stores/insights';

interface Props {
	type: Type;
	field: string;
	inter: string;
	dashboard: string;
	width: number;
	options?: Record<string, any>;
	showHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), { options: () => ({}) });

const insightsStore = useInsightsStore();

const fieldWidth = computed(() => (props.width < 20 ? 'half' : 'full'));

const value = computed({
	get() {
		return insightsStore.getVariable(props.field);
	},
	set(val: any) {
		insightsStore.setVariable(props.field, val);
	},
});
</script>

<style lang="scss" scope>
.variable {
	padding: 12px;

	&.show-header {
		padding-top: 6px;
	}

	display: grid;
	align-content: center;
	width: 100%;
	height: 100%;

	> * {
		grid-row: 1;
		grid-column: 1;
	}
}
</style>
