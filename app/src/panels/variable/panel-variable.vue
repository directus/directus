<script setup lang="ts">
import { useInsightsStore } from '@/stores/insights';
import { Type } from '@directus/types';
import { computed } from 'vue';

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

<style lang="scss" scope>
.variable {
	display: grid;
	align-content: center;
	inline-size: 100%;
	block-size: 100%;
	padding: 12px;

	&.show-header {
		padding-block-start: 6px;
	}

	> * {
		grid-row: 1;
		grid-column: 1;
	}
}
</style>
