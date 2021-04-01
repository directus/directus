<template>
	<sidebar-detail v-show="visible" icon="upload" :title="$t('import_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select :items="formats" v-model="format" />
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('upload_file') }}</p>
				<file-select @change="onSelectFile" @load="onFileLoad" />
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('target_language') }}</p>
				<language-select :disabled="useFileLanguage" :collection="collection.collection" :value="['en-US']" :field="'translations'" />
				<v-checkbox v-model="useFileLanguage" :label="$t('use_language_from_file')" />
			</div>
			<div class="field full">
				<v-button full-width @click="importData" :disabled="file === null">
					{{ $t('import_collection', { collection: collection.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { Collection, Field } from '@/types';
import { useFieldsStore } from '@/stores/';
import { FileSelect } from '../file-select';
import { LanguageSelect } from '../language-select';

export default defineComponent({
	components: {
		FileSelect,
		LanguageSelect,
	},
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	computed: {
		formats(): any[] {
			return [
				...[
					// TODO: add more formats
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
		visible(): boolean {
			return this.formats.length > 0;
		},
	},
	watch: {
		collection: function () {
			// clear file selection each time when user
			// switching between collections
			this.file = null;
			this.clearFileSelection();
		},
	},
	setup(props) {
		const format = ref('xliff');
		const file = ref<File | null>(null);
		const useFileLanguage = ref(true);
		const clearFileSelection = ref<Function>(() => {});

		return { format, file, useFileLanguage, importData, onSelectFile, onFileLoad, clearFileSelection };

		function importData() {}

		function onSelectFile(selection: File | null) {
			file.value = selection;
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
