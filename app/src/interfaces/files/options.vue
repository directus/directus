<template>
	<v-notice type="warning" v-if="junctionCollection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ $t('sort_field') }}</p>
			<interface-field
				v-model="sortField"
				:collection="junctionCollection"
				:type-allow-list="['bigInteger', 'integer']"
				allowNone
			/>
		</div>
		<div class="field full">
			<p class="type-label">{{ $t('interfaces.folder.folder') }}</p>
			<folder :folder="folderValue" default-label="system" />
			<small class="note" v-html="$t('interfaces.folder.field_hint')" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';
import { Relation, Collection } from '@/types';
import { useCollectionsStore } from '../../stores';
import Folder from '@/interfaces/_system/folder/folder.vue';
export default defineComponent({
	components: { Folder },
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
		const relationsStore = useRelationsStore();

		const sortField = computed({
			get() {
				return props.value?.sortField;
			},
			set(newFields: string) {
				emit('input', {
					...(props.value || {}),
					sortField: newFields,
				});
			},
		});

		const folderValue = computed({
			get() {
				return props.value?.folder;
			},
			set(folder: string) {
				emit('input', {
					...(props.value || {}),
					folder,
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

		const junctionCollectionExists = computed(() => {
			return !!collectionsStore.state.collections.find(
				(collection) => collection.collection === junctionCollection.value
			);
		});

		return { sortField, junctionCollection, junctionCollectionExists, folderValue };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
.form-grid {
	@include form-grid;
}
.note {
	display: block;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
