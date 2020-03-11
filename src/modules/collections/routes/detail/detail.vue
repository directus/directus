<template>
	<private-view title="Edit">
		<template v-if="item">
			<div style="margin-bottom: 20px" v-for="field in visibleFields" :key="field.field">
				<p>{{ field.name }}</p>
				<interface-text-input
					v-if="field.type === 'string'"
					:value="item[field.field]"
					:options="{}"
				/>
				<span v-else style="font-family: monospace;">{{ item[field.field] }}</span>
			</div>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import useFieldsStore from '@/stores/fields';
import { Field } from '@/stores/fields/types';
import api from '@/api';
import CollectionsNavigation from '../../components/navigation/';

export default defineComponent({
	components: { CollectionsNavigation },
	props: {
		collection: {
			type: String,
			required: true
		},
		primaryKey: {
			type: String,
			required: true
		}
	},
	setup(props) {
		const { currentProjectKey } = useProjectsStore().state;
		const fieldsStore = useFieldsStore();
		const fieldsInCurrentCollection = computed<Field[]>(() => {
			return fieldsStore.state.fields.filter(field => field.collection === props.collection);
		});
		const visibleFields = computed<Field[]>(() => {
			return fieldsInCurrentCollection.value
				.filter(field => field.hidden_browse === false)
				.sort((a, b) => (a.sort || Infinity) - (b.sort || Infinity));
		});
		const item = ref(null);
		const loading = ref(false);
		const error = ref(null);
		fetchItem();
		return { visibleFields, item, loading, error };
		async function fetchItem() {
			loading.value = true;
			try {
				const response = await api.get(
					`/${currentProjectKey}/items/${props.collection}/${props.primaryKey}`
				);
				item.value = response.data.data;
			} catch (error) {
				error.value = error;
			} finally {
				loading.value = false;
			}
		}
	}
});
</script>
