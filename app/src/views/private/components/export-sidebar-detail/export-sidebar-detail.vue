<template>
	<sidebar-detail icon="save_alt" :title="t('export_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ t('format') }}</p>
				<v-select :items="formats" v-model="format" />
				<v-checkbox v-show="!isXliff()" v-model="useFilters" :label="t('use_current_filters_settings')" />
			</div>
			<div class="field full" v-show="isXliff() && hasMoreThanOneTranslationFields">
				<p class="type-label">{{ t('translation_field') }}</p>
				<translation-field-select v-on:select="onSelectTranslationField" :collection="collection" />
			</div>
			<div class="field full" v-if="isXliff() && translationsField">
				<p class="type-label">{{ t('language') }}</p>
				<language-select v-on:select="onSelectLanguage" :collection="collection" :field="translationsField" />
			</div>
			<div class="field full">
				<v-button full-width @click="exportData" :disabled="isExportDisabled">
					{{ t('export_collection', { collection: collectionInfo.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, PropType } from 'vue';
import { Filter } from '@directus/shared/types';
import { useFieldsStore, useCollectionsStore, useRelationsStore } from '@/stores/';
import { Field, Collection } from '@/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { LanguageSelect } from '../language-select';
import { TranslationFieldSelect } from '../translation-field-select';

import filtersToQuery from '@/utils/filters-to-query';

type LayoutQuery = {
	fields?: string[];
	sort?: string;
};

export default defineComponent({
	components: {
		LanguageSelect,
		TranslationFieldSelect,
	},
	props: {
		layoutQuery: {
			type: Object as PropType<LayoutQuery>,
			default: (): LayoutQuery => ({}),
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	computed: {
		formats(): any[] {
			return [
				...[
					{
						text: this.t('csv'),
						value: 'csv',
					},
					{
						text: this.t('json'),
						value: 'json',
					},
					{
						text: this.t('xml'),
						value: 'xml',
					},
				],
				// enable XLIFF for translatable content only
				...(this.translatable
					? [
							{
								text: this.t('xliff'),
								value: 'xliff',
							},
							{
								text: this.t('xliff2'),
								value: 'xliff2',
							},
					  ]
					: []),
			];
		},
		translatable(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection);
			return fields.some((field: Field) => field.type === 'translations');
		},
		hasMoreThanOneTranslationFields(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection);
			return fields.filter((field: Field) => field.type === 'translations').length > 1;
		},
		isExportDisabled(): boolean {
			return this.isXliff() && (!this.language || !this.translationsField);
		},
	},
	watch: {
		collection: function () {
			const collectionsStore = useCollectionsStore();
			this.collectionInfo = collectionsStore.getCollection(this.collection);
			// watch it
			if (!this.translatable && !this.formats.includes(this.format)) {
				const [defaultFormat] = this.formats;
				// reset format in case if current is not available
				this.format = defaultFormat.value;
			}
		},
	},
	setup(props) {
		const { t } = useI18n();
		const collectionsStore = useCollectionsStore();
		const collectionInfo = ref<Collection | null>(collectionsStore.getCollection(props.collection));
		const format = ref('csv');
		const useFilters = ref(true);
		const language = ref<any>(null);
		const translationsField = ref<any>(null);

		return {
			t,
			collectionInfo,
			format,
			language,
			translationsField,
			useFilters,
			exportData,
			isXliff,
			onSelectTranslationField,
			onSelectLanguage,
		};

		function isXliff(): boolean {
			return ['xliff', 'xliff2'].includes(format.value);
		}

		function onSelectTranslationField(selection: string) {
			translationsField.value = selection;
		}

		function onSelectLanguage(selection: string) {
			language.value = selection;
		}

		function exportData() {
			let url = getRootPath() + 'items/';

			let params: Record<string, any> = {
				access_token: api.defaults.headers.Authorization.substring(7),
			};

			switch (format.value) {
				case 'csv':
				case 'json':
				case 'xml':
					url += props.collection;
					params.export = format.value;
					break;
				case 'xliff':
				case 'xliff2':
					{
						const relationsStore = useRelationsStore();
						const [languageRelation, parentRelation] = relationsStore.getRelationsForField(
							props.collection,
							translationsField.value
						);
						params.optional = JSON.stringify({
							language: language.value,
							languageField: languageRelation.meta?.junction_field,
							parentKeyField: parentRelation.meta?.junction_field,
						});
						url += languageRelation.meta?.many_collection;
						params.export = format.value;
					}
					break;
			}

			if (!isXliff() && useFilters.value === true) {
				if (props.layoutQuery && props.layoutQuery.sort) params.sort = props.layoutQuery.sort;
				if (props.layoutQuery && props.layoutQuery.fields) params.fields = props.layoutQuery.fields;
				if (props.searchQuery) params.search = props.searchQuery;

				if (props.filters?.length) {
					params = {
						...params,
						...filtersToQuery(props.filters),
					};
				}

				if (props.searchQuery) {
					params.search = props.searchQuery;
				}
			}

			// add primary key to request for XLIFF export
			// it's required for correct generation of XLIFF file
			if (['xliff', 'xliff2'].includes(format.value)) {
				const fieldsStore = useFieldsStore();
				const { field: primaryKey } = fieldsStore.getPrimaryKeyFieldForCollection(props.collection);
				if (!params.fields) {
					params.fields = [primaryKey];
				} else if (!params.fields.includes(primaryKey)) {
					params.fields = [...params.fields, primaryKey];
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
