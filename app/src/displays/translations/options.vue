<template>
	<v-notice v-if="collection === null" type="warning">
		{{ t('interfaces.list-o2m.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ t('display_template') }}</p>
			<v-field-template v-model="template" :collection="translationsCollection.collection" :depth="2" />
		</div>
		<div class="field full">
			<p class="type-label">{{ t('displays.translations.language_field') }}</p>
			<v-select v-model="languageField" :items="languageFields" item-text="name" item-value="field" />
		</div>
		<div class="field half">
			<p class="type-label">{{ t('displays.translations.default_language') }}</p>
			<v-select
				v-model="defaultLanguage"
				show-deselect
				:placeholder="t('select_an_item')"
				:items="languages"
				:item-text="languageField ?? langCode.field"
				:item-value="langCode.field"
			/>
		</div>
		<div class="field half">
			<p class="type-label">{{ t('displays.translations.user_language') }}</p>
			<v-checkbox v-model="userLanguage" block :label="t('displays.translations.enable')" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed, ref, watch, toRefs } from 'vue';
import api from '@/api';
import useRelation from '@/composables/use-m2m';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		collection: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const { collection } = toRefs(props);

		const field = computed(() => props.fieldData.field);

		const languageField = computed({
			get() {
				return props.value?.languageField;
			},
			set(newVal: string) {
				emit('input', {
					...(props.value || {}),
					languageField: newVal,
				});
			},
		});

		const defaultLanguage = computed({
			get() {
				return props.value?.defaultLanguage;
			},
			set(newVal: string) {
				emit('input', {
					...(props.value || {}),
					defaultLanguage: newVal,
				});
			},
		});

		const userLanguage = computed({
			get() {
				return props.value?.userLanguage;
			},
			set(newVal: string) {
				emit('input', {
					...(props.value || {}),
					userLanguage: newVal,
				});
			},
		});

		const template = computed({
			get() {
				return props.value?.template;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					template: newTemplate,
				});
			},
		});

		const {
			junctionCollection: translationsCollection,
			relationCollection: languagesCollection,
			relationPrimaryKeyField: langCode,
			relationFields: languageFields,
		} = useRelation(collection, field);

		const languages = ref<Record<string, any>[]>([]);

		watch(
			languagesCollection,
			async (newCollection) => {
				const response = await api.get(`items/${newCollection.collection}`, {
					params: {
						limit: -1,
					},
				});

				languages.value = response.data.data;
			},
			{ immediate: true }
		);

		return {
			t,
			template,
			translationsCollection,
			languagesCollection,
			userLanguage,
			languages,
			defaultLanguage,
			langCode,
			languageField,
			languageFields,
		};
	},
});
</script>
