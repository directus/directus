<template>
	<sidebar-detail v-if="visible" icon="upload" :title="$t('import_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select :items="formats" v-model="format" />
			</div>
			<div class="field full">
				<p class="type-label">{{ $t('upload_file') }}</p>
				<file-upload />
			</div>
			<div class="field full">
				<v-button full-width @click="importData">
					{{ $t('import_collection', { collection: collection.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { Collection } from '@/types';
import { useFieldsStore } from '@/stores/';
import { Field } from '@/types';
import { FileUpload } from '../file-upload';

export default defineComponent({
	components: {
		FileUpload
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
		}
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
		const format = ref('xliff');

		return { format, importData };

		function importData() {
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
