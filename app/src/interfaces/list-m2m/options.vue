<template>
	<v-notice v-if="junctionCollection === null" type="warning">
		{{ t('interfaces.list-o2m.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ t('display_template') }}</p>
			<v-field-template
				v-model="template"
				:collection="junctionCollection"
				:depth="2"
				:inject="!!junctionCollectionInfo ? null : { fields: newFields, collections: newCollections, relations }"
				:placeholder="
					junctionCollectionInfo && junctionCollectionInfo.meta && junctionCollectionInfo.meta.display_template
				"
			/>
		</div>

		<div class="field half-left">
			<p class="type-label">{{ t('creating_items') }}</p>
			<v-checkbox v-model="enableCreate" block :label="t('enable_create_button')" />
		</div>

		<div class="field half-right">
			<p class="type-label">{{ t('selecting_items') }}</p>
			<v-checkbox v-model="enableSelect" block :label="t('enable_select_button')" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Collection, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
import { useCollectionsStore } from '@/stores';
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
		newCollections: {
			type: Array as PropType<Collection[]>,
			default: () => [],
		},
		newFields: {
			type: Array as PropType<Field[]>,
			default: () => [],
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();

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

		const enableCreate = computed({
			get() {
				return props.value?.enableCreate ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableCreate: val,
				});
			},
		});

		const enableSelect = computed({
			get() {
				return props.value?.enableSelect ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableSelect: val,
				});
			},
		});

		const junctionCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const junctionRelation = props.relations.find(
				(relation) => relation.related_collection === props.collection && relation.meta?.one_field === field
			);
			return junctionRelation?.collection || null;
		});

		const junctionCollectionInfo = computed(() => {
			if (!junctionCollection.value) return null;

			return collectionsStore.getCollection(junctionCollection.value);
		});

		return { t, template, enableCreate, enableSelect, junctionCollection, junctionCollectionInfo };
	},
});
</script>
