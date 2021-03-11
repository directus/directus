<template>
	<div>
		<p v-if="loading || !items.length">{{ loadingText }}</p>
		<v-select v-else :value="value" @input="$listeners.input" :items="items">
			<template #prepend v-if="icon">
				<v-icon :name="icon" />
			</template>
		</v-select>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useRelationsStore } from '@/stores';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import api from '@/api';
import { Field, Relation } from '@/types';
import { i18n } from '@/lang/';

export default defineComponent({
	props: {
		value: {
			type: [Number, String, Object],
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			default: null,
		},
		column: {
			type: String,
			//required: true,
		},
		relation: {
			type: String,
			default: '_eq',
		},
		related_value: {
			type: String,
			default: false,
		},
	},
	setup(props, { emit }) {
		const field_rel: Relation = useRelationsStore().getRelationsForField(props.collection, props.field)[0];
		const one_table = field_rel.one_collection;

		const items = ref<Record<string, any>[] | null>([]);
		const loading = ref(false);
		const loadingText = i18n.t('no_items');

		async function fetchItems() {
			if (one_table) {
				loading.value = true;
				const params: any = {};
				let qs = '';
				if (props.column && props.relation && props.related_value) {
					// Right now I don't get the filter as an object given to
					// api.get to work.
					/*params.filter = {
						[props.column]: {
							[props.relation]: props.related_value,
						},
					};*/
					qs = `?filter[${props.column}][${props.relation}]=${props.related_value}`;
				}
				try {
					const response = await api.get('/items/' + one_table + qs, params);
					const values: any[] = [];
					const one_fields = getFieldsFromTemplate(props.template);
					response.data.data.forEach((item: Record<string, string | number | boolean>) => {
						values.push({
							text: one_fields.map((field) => item[field]).join(' - '),
							value: item[field_rel.one_primary],
						});
					});
					items.value = values;
				} catch (err) {
					console.log('m2o-dropdown - setup:fetchItems - err: ' + err);
				}
			} else {
				console.log('m2o-dropdown - setup:fetchItems - skipping, no one_table');
			}
			loading.value = false;
		}
		fetchItems();
		return { items, loading, loadingText };
	},
});
</script>
