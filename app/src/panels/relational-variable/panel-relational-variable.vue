<template>
	<div class="relational-variable" :class="{ 'show-header': showHeader, centered: !multiple }">
		<v-notice v-if="!collection" type="warning">
			{{ t('collection_field_not_setup') }}
		</v-notice>

		<multiple-relation
			v-else-if="multiple"
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:value="value"
			:limit="limit"
			@input="value = $event"
			@select="selectModalOpen = true"
		/>
		<single-relation
			v-else
			:collection="collection"
			:template="displayTemplate"
			:filter="filter"
			:value="value"
			@input="value = $event"
			@select="selectModalOpen = true"
		/>

		<drawer-collection
			:active="selectModalOpen"
			:collection="collection"
			:selection="value"
			:filter="filter"
			:multiple="multiple"
			@input="onSelection"
			@update:active="selectModalOpen = false"
		/>
	</div>
</template>

<script setup lang="ts">
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
/*const emit = */ defineEmits(['input']);

const insightsStore = useInsightsStore();

const value = computed({
	get() {
		const val = insightsStore.getVariable(props.field);
		if (props.multiple) return val ?? [];
		return val ? [val] : undefined;
	},
	set(val: any) {
		const _val = !props.multiple && Array.isArray(val) ? val[0] : val;
		insightsStore.setVariable(props.field, _val);
	},
});

const selectModalOpen = ref(false);

function onSelection(data: (number | string)[]) {
	selectModalOpen.value = false;

	if (!Array.isArray(data) || data.length === 0) {
		value.value = [];
		return;
	}

	if (props.multiple) {
		const items = Array.from(new Set(data.concat(value.value)));

		if (items.length > props.limit) {
			unexpectedError(new Error('More items selected than the allowed limit'));
			value.value = items.slice(0, props.limit);
		} else {
			value.value = items;
		}
	} else {
		value.value = data;
	}
}
</script>

<style lang="scss" scope>
.relational-variable {
	padding: 12px;
	height: 100%;

	&.show-header {
		padding-top: 6px;
	}

	&.centered {
		display: grid;
		align-content: center;
		width: 100%;
	}

	> * {
		grid-row: 1;
		grid-column: 1;
	}
}
</style>
