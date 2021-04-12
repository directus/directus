<template>
	<sidebar-detail icon="save_alt" :title="$t('export_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select :items="formats" v-model="format" />
				<v-checkbox v-model="useFilters" :label="$t('use_current_filters_settings')" />
			</div>
			<div class="field full" v-show="hasMoreThanOneTranslationFields">
				<p class="type-label">{{ $t('translation_field') }}</p>
				<translation-field-select
					@input="onSelectTranslationField"
					:collection="collection.collection"
					:value="translationField"
				/>
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('language') }}</p>
				<language-select
					@input="onSelectLanguage"
					:collection="collection.collection"
					:value="language"
					:field="translationField"
				/>
			</div>
			<div class="field full">
				<v-button full-width @click="exportData">
					{{ $t('export_collection', { collection: collection.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { Collection } from '@/types';
import { useFieldsStore, useUserStore } from '@/stores/';
import { Field } from '@/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { LanguageSelect } from '../language-select';
import { TranslationFieldSelect } from '../translation-field-select';

export default defineComponent({
	components: {
		LanguageSelect,
		TranslationFieldSelect,
	},
	props: {
		layoutQuery: {
			type: Object,
			default: () => ({}),
		},
		searchQuery: {
			type: String,
			default: null,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	computed: {
		formats(): any[] {
			return [
				...[
					{
						text: this.$t('csv'),
						value: 'csv',
					},
					{
						text: this.$t('json'),
						value: 'json',
					},
				],
				// enable XLIFF for translatable content only
				...(this.translatable
					? [
							{
								text: this.$t('xliff'),
								value: 'xliff',
							},
							{
								text: this.$t('xliff2'),
								value: 'xliff2',
							},
					  ]
					: []),
			];
		},
		translatable(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection.collection);
			return fields.some((field: Field) => field.type === 'translations');
		},
		hasMoreThanOneTranslationFields(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection.collection);
			return fields.filter((field: Field) => field.type === 'translations').length > 1;
		},
	},
	watch: {
		collection: function () {
			// watch it
			if (!this.translatable && !this.formats.includes(this.format)) {
				const [defaultFormat] = this.formats;
				// reset format in case if current is not available
				this.format = defaultFormat.value;
			}
		},
	},
	setup(props) {
		const format = ref('csv');
		const useFilters = ref(true);
		const language = ref<any>(null);
		const translationField = ref<any>(null);

		return { format, language, translationField, useFilters, exportData };

		function exportData() {
			const url = getRootPath() + `items/${props.collection.collection}`;

			let params: Record<string, any> = {
				access_token: api.defaults.headers.Authorization.substring(7),
			};

			switch (format.value) {
				case 'csv':
					params.export = 'csv';
					break;
				case 'json':
					params.export = 'json';
					break;
				case 'xliff':
				case 'xliff2':
					const userStore = useUserStore();
					const user = userStore.state.currentUser;
					if (user && user.language) {
						params.optional = JSON.stringify({ language: user.language });
					}
					params.export = format.value;
					break;
			}

			if (useFilters.value === true) {
				params = {
					...params,
					...props.layoutQuery,
				};

				if (props.searchQuery) {
					params.search = props.searchQuery;
				}
			}

			// add primary key to request for XLIFF export
			// it's required for correct generation of XLIFF file
			if (['xliff', 'xliff2'].includes(format.value)) {
				const fieldsStore = useFieldsStore();
				const { field: primaryKey } = fieldsStore.getPrimaryKeyFieldForCollection(props.collection.collection);
				if (!params.fields) {
					params.fields = [primaryKey];
				} else if (!params.fields.includes(primaryKey)) {
					params.fields = [...params.fields, primaryKey];
				}
			}

			const qs = Object.keys(params)
				.map((key) => `${key}=${params[key]}`)
				.join('&');

			window.open(`${url}?${qs}`);
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
