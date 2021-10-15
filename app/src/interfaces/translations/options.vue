<template>
	<v-notice v-if="collection === null" class="full" type="warning">
		{{ t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ t('interfaces.translations.language_field') }}</p>
			<v-select v-model="languageField" :items="languageCollectionFields" item-text="name" item-value="field" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed, toRefs } from 'vue';
import useRelation from '@/composables/use-m2m';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		value: {
			type: Object as PropType<Record<string, any>>,
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
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					languageField: newTemplate,
				});
			},
		});

		const { relationCollection: languageCollection, relationFields: languageCollectionFields } = useRelation(
			collection,
			field
		);

		return {
			t,
			languageField,
			languageCollection,
			languageCollectionFields,
		};
	},
});
</script>
