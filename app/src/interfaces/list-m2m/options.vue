<template>
	<v-notice type="warning" v-if="junctionCollection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ $t('display_template') }}</p>
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
			<p class="type-label">{{ $t('creating_items') }}</p>
			<v-checkbox block :label="$t('enable_create_button')" v-model="enableCreate" />
		</div>

		<div class="field half-right">
			<p class="type-label">{{ $t('selecting_items') }}</p>
			<v-checkbox block :label="$t('enable_select_button')" v-model="enableSelect" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation, Collection } from '@/types';
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
			type: Object as PropType<any>,
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
	setup(props, { emit }) {
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
				(relation) => relation.one_collection === props.collection && relation.one_field === field
			);
			return junctionRelation?.many_collection || null;
		});

		const junctionCollectionInfo = computed(() => {
			if (!junctionCollection.value) return null;

			return collectionsStore.getCollection(junctionCollection.value);
		});

		return { template, enableCreate, enableSelect, junctionCollection, junctionCollectionInfo };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
.form-grid {
	@include form-grid;
}
</style>
