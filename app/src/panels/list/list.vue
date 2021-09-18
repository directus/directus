<template>
	<div class="list" :class="{ 'has-header': show_header, loading }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else>
			<v-list>
				<v-list-item
					v-for="row in list"
					:key="row[primaryKeyField.field]"
					class="selectable"
					clickable
					@click="startEditing(row)"
				>
					<render-template :item="row" :collection="options.collection" :template="renderTemplate" />
					<div class="spacer" />
				</v-list-item>
			</v-list>
		</div>

		<drawer-item
			:active="!!currentlyEditing"
			:collection="options.collection"
			:primary-key="currentlyEditing ?? '+'"
			:edits="editsAtStart"
			@input="saveEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import api from '@/api';
import { isEqual, clone } from 'lodash';
import { Filter } from '@directus/shared/types';
import { useFieldsStore } from '@/stores';
import DrawerItem from '@/views/private/components/drawer-item';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';

type ListOptions = {
	displayTemplate: string;
	sortField: string;
	sortDirection: 'asc' | 'desc';
	collection: string;
	limit: number;
	filter: Filter;
};

export default defineComponent({
	components: { DrawerItem },
	props: {
		options: {
			type: Object as PropType<ListOptions>,
			default: null,
		},
		show_header: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const currentlyEditing = ref<number | string>();
		const editsAtStart = ref<Record<string, any>>();

		const fieldsStore = useFieldsStore();

		const list = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();

		const renderTemplate = computed(() => {
			return props.options.displayTemplate;
		});

		const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.options.collection));

		fetchData();

		watch(
			() => props.options,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions)) return;
				fetchData();
			},
			{ deep: true, immediate: true }
		);

		return {
			list,
			loading,
			renderTemplate,
			primaryKeyField,
			startEditing,
			saveEdits,
			cancelEdit,
			currentlyEditing,
			editsAtStart,
		};

		async function fetchData() {
			if (!props.options) return;

			loading.value = true;

			try {
				const sort = props.options.sortField;

				const res = await api.get(`/items/${props.options.collection}`, {
					params: {
						fields: [
							primaryKeyField.value.field,
							...adjustFieldsForDisplays(getFieldsFromTemplate(renderTemplate.value), props.options.collection),
						],
						filter: props.options.filter,
						sort: props.options.sortDirection === 'desc' ? `-${sort}` : sort,
						limit: props.options.limit ?? 5,
					},
				});

				list.value = res.data.data;
			} catch (err) {
				error.value = err;
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}

		function startEditing(item: Record<string, any>) {
			currentlyEditing.value = item[primaryKeyField.value.field];
			editsAtStart.value = item;
		}

		async function saveEdits(item: Record<string, any>) {
			try {
				await api.patch(`/items/${props.options.collection}/${currentlyEditing.value}`, item);
			} catch (err) {
				unexpectedError(err);
			}

			await fetchData();
		}

		function cancelEdit() {
			editsAtStart.value = undefined;
			currentlyEditing.value = undefined;
		}
	},
});
</script>

<style scoped>
.list {
	--v-list-padding: 0;
	--v-list-border-radius: 0;
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;
	--v-list-item-margin: 0;

	height: 100%;
	padding: 0 12px;
	overflow-y: auto;
}

.list.loading {
	display: flex;
	align-items: center;
	justify-content: center;
}

.v-list-item {
	height: 48px;
	border-top: var(--border-width) solid var(--border-subdued);
}

.v-list-item:last-child {
	border-bottom: var(--border-width) solid var(--border-subdued);
}
</style>
