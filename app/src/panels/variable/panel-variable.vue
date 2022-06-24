<template>
	<div class="variable">
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

<script lang="ts" setup>
import { Type } from '@directus/shared/types';
import { computed } from 'vue';
import { useInsightsStore } from '@/stores';

interface Props {
	type: Type;
	field: string;
	inter: string;
	dashboard: string;
	width: number;
	options?: Record<string, any>;
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
	padding-top: 0px;
	display: grid;
	width: 100%;
	height: 100%;

	> * {
		grid-row: 1;
		grid-column: 1;
	}
}
</style>
