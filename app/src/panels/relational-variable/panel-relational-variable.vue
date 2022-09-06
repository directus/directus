<template>
	<div class="relational-variable" :class="{ 'show-header': showHeader }">
		<interface-select-dropdown-m2o v-if="!multiple" :collection="collection" :filter="filter" />
	</div>
</template>

<script lang="ts" setup>
import { Type } from '@directus/shared/types';
import { computed } from 'vue';
import { useInsightsStore } from '@/stores/insights';

interface Props {
	type: Type;
	multiple: boolean;
	collection: string;
	filter: Record<string, any>;
	dashboard: string;
	showHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const insightsStore = useInsightsStore();

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
.relational-variable {
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
