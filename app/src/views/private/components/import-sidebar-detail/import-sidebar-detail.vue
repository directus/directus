<template>
	<sidebar-detail v-show="visible" icon="upload" :title="$t('import_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select :items="formats" v-model="format" />
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('upload_file') }}</p>
				<file-select @change="onSelectFile" @load="onFileLoad" accept=".xlf, application/xliff+xml" />
			</div>
			<div class="field full" v-show="hasMoreThanOneTranslationFields">
				<p class="type-label">{{ $t('target_translation_field') }}</p>
				<translation-field-select @input="onSelectTranslationField" :collection="collection" />
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('target_language') }}</p>
				<language-select
					@input="onSelectLanguage"
					v-if="!useFileLanguage && translationField"
					:collection="collection"
					:field="translationField"
				/>
				<v-checkbox v-model="useFileLanguage" :label="$t('use_language_from_file')" />
			</div>
			<div class="field full">
				<v-button
					:loading="importing"
					full-width
					@click="importData"
					:disabled="file === null || (!language && !useFileLanguage)"
				>
					{{ $t('import_collection', { collection: collectionInfo.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import api from '@/api';
import i18n from '@/lang';
import { defineComponent, ref } from '@vue/composition-api';
import { Field } from '@/types';
import { useFieldsStore, useCollectionsStore } from '@/stores/';
import { FileSelect } from '../file-select';
import { LanguageSelect } from '../language-select';
import { TranslationFieldSelect } from '../translation-field-select';
import { notify } from '@/utils/notify';

export default defineComponent({
	components: {
		FileSelect,
		LanguageSelect,
		TranslationFieldSelect,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	computed: {
		formats(): any[] {
			return [
				...[
					// TODO: add more formats in the future...
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
			const fields = fieldsStore.getFieldsForCollection(this.collection);
			return fields.some((field: Field) => field.type === 'translations');
		},
		hasMoreThanOneTranslationFields(): boolean {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore.getFieldsForCollection(this.collection);
			return fields.filter((field: Field) => field.type === 'translations').length > 1;
		},
		visible(): boolean {
			return this.formats.length > 0;
		},
	},
	watch: {
		collection: function () {
			// clear file and language selection each time when user
			// switching between collections
			this.clearFile();
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(props.collection);
		const format = ref('xliff');
		const language = ref<any>(null);
		const translationField = ref<any>(null);
		const file = ref<File | null>(null);
		const useFileLanguage = ref(true);
		const clearFileSelection = ref(() => undefined);
		const importing = ref<boolean>(false);

		return {
			collectionInfo,
			format,
			file,
			language,
			translationField,
			useFileLanguage,
			importData,
			importing,
			onSelectFile,
			onSelectLanguage,
			onSelectTranslationField,
			onFileLoad,
			clearFile,
			clearFileSelection,
		};

		async function importData() {
			if (!file.value) throw new Error('[import-sidebar-detail]: You need to select a file for import.');
			importing.value = true;

			const formData = new FormData();
			formData.append('format', format.value);
			formData.append('field', translationField.value);
			if (!useFileLanguage.value) {
				formData.append('language', language.value);
			}
			formData.append('file', file.value);

			try {
				const result = await api.post(`/items/${props.collection}/import`, formData);
				// cleanup fields in case of successfull import
				const { data } = result.data;
				const importedAmount = data ? data.length : 0;
				clearFile();
				emit('refresh');
				notify({
					title: i18n.tc('import_successfull', importedAmount > 0 ? (importedAmount > 1 ? 2 : 1) : 0, {
						amount: importedAmount,
					}),
					type: 'success',
				});
			} catch (error) {
				notify({
					title: i18n.tc('import_failed'),
					text: error.message,
					type: 'error',
					dialog: true,
					error,
				});
			} finally {
				importing.value = false;
			}
		}

		function clearFile() {
			file.value = null;
			clearFileSelection.value();
		}

		function onSelectLanguage(selection: string) {
			language.value = selection;
		}

		function onSelectFile(selection: File | null) {
			file.value = selection;
		}

		function onSelectTranslationField(selection: string) {
			translationField.value = selection;
		}

		function onFileLoad(options: any) {
			clearFileSelection.value = options.clear;
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
	margin-top: 8px;
}
</style>
