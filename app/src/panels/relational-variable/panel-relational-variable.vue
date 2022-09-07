<template>
	<div class="relational-variable" :class="{ 'show-header': showHeader }">
		<multiple-relation
			v-if="multiple"
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:value="value"
			:limit="limit"
			@input="saveSelection"
			@select="selectModalOpen = true"
		/>
		<single-relation
			v-else
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:value="value"
			@input="saveSelection"
			@select="selectModalOpen = true"
		/>

		<drawer-collection
			:active="selectModalOpen"
			:collection="collection"
			:filter="filter"
			:multiple="multiple"
			@input="onSelection"
			@update:active="selectModalOpen = false"
		/>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInsightsStore } from '@/stores/insights';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerCollection from '@/views/private/components/drawer-collection.vue';
import SingleRelation from './single-relation.vue';
import MultipleRelation from './multiple-relation.vue';

interface Props {
	field: string;
	collection: string;
	multiple: boolean;
	displayTemplate: string;
	filter: Record<string, any>;
	limit: number;
	dashboard: string;
	showHeader?: boolean;
}
const { t } = useI18n();
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(['input']);
const insightsStore = useInsightsStore();
const value = computed({
	get() {
		return insightsStore.getVariable(props.field) || [];
	},
	set(val: any) {
		insightsStore.setVariable(props.field, val);
	},
});
function saveSelection(data: any) {
	// console.log('save', props.field, data);
	value.value = data;
}

const selectModalOpen = ref(false);
function onSelection(data: (number | string)[]) {
	selectModalOpen.value = false;
	if (!Array.isArray(data) || data.length === 0) {
		value.value = [];
		return;
	}
	if (props.multiple) {
		const items = value.value.slice().concat(data);
		if (items.length > props.limit) {
			unexpectedError(new Error('More items selected than the allowed limit'));
			value.value = items.slice(0, props.limit);
		} else {
			value.value = items;
		}
		return;
	}
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
