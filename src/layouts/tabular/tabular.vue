<template>
	<v-table
		:items="items"
		:loading="loading"
		:headers="headers"
		fixed-header
		@click:row="onRowClick"
	></v-table>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import useFieldsStore from '@/stores/fields';
import { HeaderRaw, Item } from '@/components/v-table/types';
import { Field } from '@/stores/fields/types';
import router from '@/router';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true
		}
	},
	setup(props) {
		const { currentProjectKey } = useProjectsStore().state;
		const fieldsStore = useFieldsStore();

		const error = ref(null);
		const items = ref([]);
		const loading = ref(true);

		const fieldsInCurrentCollection = computed<Field[]>(() => {
			return fieldsStore.state.fields.filter(field => field.collection === props.collection);
		});

		const visibleFields = computed<Field[]>(() => {
			return fieldsInCurrentCollection.value.filter(field => field.hidden_browse === false);
		});

		const headers = computed<HeaderRaw[]>(() => {
			return visibleFields.value.map(field => ({
				text: field.name,
				value: field.field
			}));
		});

		const primaryKeyField = computed<Field>(() => {
			/**
			 * @NOTE
			 * It's safe to assume that every collection has a primary key.
			 */
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return fieldsInCurrentCollection.value.find(field => field.primary_key === true)!;
		});

		getItems();

		watch(() => props.collection, getItems);

		return {
			error,
			items,
			loading,
			headers,
			onRowClick,
			primaryKeyField
		};

		async function getItems() {
			items.value = [];
			error.value = null;
			loading.value = true;

			try {
				const response = await api.get(`/${currentProjectKey}/items/${props.collection}`);
				items.value = response.data.data;
			} catch (error) {
				error.value = error;
			} finally {
				loading.value = false;
			}
		}

		function onRowClick(item: Item) {
			const primaryKey = item[primaryKeyField.value.field];
			router.push(`/${currentProjectKey}/collections/${props.collection}/${primaryKey}`);
		}
	}
});
</script>

<style lang="scss" scoped>
.v-table {
	height: 100%;
}
</style>
