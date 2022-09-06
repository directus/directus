<template>
	<div class="relational-variable" :class="{ 'show-header': showHeader }">
		<multiple-relation
			v-if="multiple"
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:items="value"
			@input="saveSelection"
		/>
		<single-relation
			v-else
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:item="value"
			@input="saveSelection"
		/>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useInsightsStore } from '@/stores/insights';
import { useI18n } from 'vue-i18n';
import SingleRelation from './single-relation.vue';
import MultipleRelation from './multiple-relation.vue';

interface Props {
	field: string;
	collection: string;
	multiple: boolean;
	displayTemplate: string;
	filter: Record<string, any>;
	dashboard: string;
	showHeader?: boolean;
}
const { t } = useI18n();

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits(['input']);

const insightsStore = useInsightsStore();

const value = computed({
	get() {
		//console.log('aha', insightsStore.getVariable(props.field));
		return insightsStore.getVariable(props.field) || [];
	},
	set(val: any) {
		//console.log('save', val);
		insightsStore.setVariable(props.field, val);
	},
});

function saveSelection(data: any) {
	// console.log('save', props.field, data);
	value.value = data;
}
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
