<template>
	<sidebar-detail icon="save_alt" :title="t('export_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ t('format') }}</p>
				<v-select
					v-model="format"
					:items="[
						{
							text: t('csv'),
							value: 'csv',
						},
						{
							text: t('json'),
							value: 'json',
						},
						{
							text: t('xml'),
							value: 'xml',
						},
					]"
				/>
				<v-checkbox v-model="useFilters" :label="t('use_current_filters_settings')" />
			</div>

			<div class="field full">
				<v-button full-width @click="exportData">
					{{ t('export_collection', { collection: collectionName }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType, computed } from 'vue';
import { Filter } from '@directus/shared/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { useCollectionsStore } from '@/stores/';

type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
};

export default defineComponent({
	props: {
		layoutQuery: {
			type: Object as PropType<LayoutQuery>,
			default: (): LayoutQuery => ({}),
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
		search: {
			type: String as PropType<string | null>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
	},

	setup(props) {
		const { t } = useI18n();

		const format = ref('csv');
		const useFilters = ref(true);
		const collectionsStore = useCollectionsStore();
		const collectionName = computed(() => collectionsStore.getCollection(props.collection).name);

		return { t, format, useFilters, exportData, collectionName };

		function exportData() {
			const endpoint = props.collection.startsWith('directus_')
				? `${props.collection.substring(9)}`
				: `items/${props.collection}`;
			const url = getRootPath() + endpoint;

			let params: Record<string, unknown> = {
				access_token: api.defaults.headers?.Authorization.substring(7),
				export: format.value || 'json',
			};

			if (useFilters.value === true) {
				if (props.layoutQuery?.sort) params.sort = props.layoutQuery.sort;
				if (props.layoutQuery?.fields) params.fields = props.layoutQuery.fields;
				if (props.layoutQuery?.limit) params.limit = props.layoutQuery.limit;

				if (props.search) params.search = props.search;

				if (props.filter) {
					params.filter = props.filter;
				}

				if (props.search) {
					params.search = props.search;
				}
			}

			const exportUrl = api.getUri({
				url,
				params,
			});

			window.open(exportUrl);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	width: 100%;
	margin-top: 8px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
