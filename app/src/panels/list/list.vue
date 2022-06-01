<template>
	<div class="list" :class="{ 'has-header': showHeader, loading, 'no-data': !hasData }">
		<v-progress-circular v-if="loading" indeterminate />
		<span v-else-if="!hasData" class="type-note">{{ t('no_data') }}</span>
		<div v-else>
			<v-list>
				<v-list-item
					v-for="row in list"
					:key="row[primaryKeyField.field]"
					class="selectable"
					clickable
					@click="startEditing(row)"
				>
					<render-template :item="row" :collection="collection" :template="renderTemplate" />
					<div class="spacer" />
				</v-list-item>
			</v-list>
		</div>

		<drawer-item
			:active="!!currentlyEditing"
			:collection="collection"
			:primary-key="currentlyEditing ?? '+'"
			:edits="editsAtStart"
			@input="saveEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, PropType } from 'vue';
import api from '@/api';
import { Filter } from '@directus/shared/types';
import { useFieldsStore } from '@/stores';
import DrawerItem from '@/views/private/components/drawer-item';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getEndpoint } from '@directus/shared/utils';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	components: { DrawerItem },
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},

		displayTemplate: {
			type: String,
			default: '',
		},
		sortField: {
			type: String,
			default: undefined,
		},
		sortDirection: {
			type: String,
			default: 'desc',
		},
		collection: {
			type: String,
			required: true,
		},
		limit: {
			type: Number,
			default: 5,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: () => ({}),
		},
	},
	setup(props) {
		const { t } = useI18n();

		const currentlyEditing = ref<number | string>();
		const editsAtStart = ref<Record<string, any>>();

		const fieldsStore = useFieldsStore();

		const list = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();

		const hasData = computed(() => {
			return list.value && list.value.length > 0;
		});

		const renderTemplate = computed(() => {
			return props.displayTemplate;
		});

		const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection));

		watchEffect(async () => await fetchData());

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
			hasData,
			t,
		};

		async function fetchData() {
			if (!props) return;

			loading.value = true;

			try {
				const sort = props.sortField;

				const res = await api.get(getEndpoint(props.collection), {
					params: {
						fields: [
							primaryKeyField.value.field,
							...adjustFieldsForDisplays(getFieldsFromTemplate(renderTemplate.value), props.collection),
						],
						filter: props.filter,
						sort: props.sortDirection === 'desc' ? `-${sort}` : sort,
						limit: props.limit ?? 5,
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
				await api.patch(`/items/${props.collection}/${currentlyEditing.value}`, item);
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
