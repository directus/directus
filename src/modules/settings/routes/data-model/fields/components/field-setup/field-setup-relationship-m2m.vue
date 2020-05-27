<template>
	<div class="grid">
		<div class="field">
			<div class="type-label">{{ $t('this_collection') }}</div>
			<v-input disabled :value="collection" />
		</div>
		<div class="field">
			<div class="type-label">{{ $t('junction_collection') }}</div>
			<v-select :items="collectionItems" v-model="junctionCollection" />
		</div>
		<div class="field">
			<div class="type-label">{{ $t('related_collection') }}</div>
			<v-select :items="collectionItems" v-model="relatedCollection" />
		</div>
		<v-input disabled :value="field.field" />
		<v-select
			:disabled="!junctionCollection"
			:items="junctionFields"
			v-model="junctionFieldCurrent"
		/>
		<div class="spacer" />
		<div class="spacer" />
		<v-select
			:disabled="!junctionCollection"
			:items="junctionFields"
			v-model="junctionFieldRelated"
		/>
		<v-input disabled value="id" />
		<v-icon name="arrow_forward" />
		<v-icon name="arrow_backward" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import orderBy from 'lodash/orderBy';
import { Field } from '@/stores/fields/types';
import useFieldsStore from '@/stores/fields/';
import { Relation } from '@/stores/relations/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		isNew: {
			type: Boolean,
			required: true,
		},
		newRelations: {
			type: Array as PropType<Partial<Relation>[]>,
			required: true,
		},
		existingRelations: {
			type: Array as PropType<Relation[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _newRelations = useSync(props, 'newRelations', emit);
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const availableCollections = computed(() => {
			return orderBy(
				collectionsStore.state.collections.filter((collection) => {
					return (
						collection.collection.startsWith('directus_') === false &&
						collection.collection !== props.collection
					);
				}),
				['collection'],
				['asc']
			);
		});

		const collectionItems = computed(() =>
			availableCollections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}))
		);

		const defaultNewRelations = computed<Partial<Relation>[]>(() => [
			{
				collection_many: undefined,
				field_many: undefined,
				collection_one: props.field.collection,
				field_one: props.field.field,
				junction_field: undefined,
			},
			{
				collection_many: undefined,
				field_many: undefined,
				collection_one: undefined,
				field_one: undefined,
				junction_field: undefined,
			},
		]);

		const junctionCollection = computed({
			get() {
				return props.newRelations[0]?.collection_many || null;
			},
			set(newJunctionCollection: string | null) {
				let relations: readonly Partial<Relation>[];

				if (_newRelations.value.length === 0) relations = [...defaultNewRelations.value];
				else relations = [..._newRelations.value];

				relations[0].collection_many = newJunctionCollection || undefined;
				relations[1].collection_many = newJunctionCollection || undefined;
				_newRelations.value = relations;
			},
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore
				.getFieldsForCollection(junctionCollection.value)
				.map((field: Field) => ({
					text: field.name,
					value: field.field,
				}));
		});

		const relatedCollection = computed({
			get() {
				return props.newRelations[1]?.collection_one || null;
			},
			set(newRelatedCollection: string | null) {
				let relations: readonly Partial<Relation>[];

				if (_newRelations.value.length === 0) relations = [...defaultNewRelations.value];
				else relations = [..._newRelations.value];

				relations[1].collection_one = newRelatedCollection || undefined;
				_newRelations.value = relations;
			},
		});

		const junctionFieldCurrent = computed({
			get() {
				return props.newRelations[0]?.field_many || null;
			},
			set(newJunctionField: string | null) {
				let relations: readonly Partial<Relation>[];

				if (_newRelations.value.length === 0) relations = [...defaultNewRelations.value];
				else relations = [..._newRelations.value];

				relations[0].field_many = newJunctionField || undefined;
				relations[1].junction_field = newJunctionField || undefined;
				_newRelations.value = relations;
			},
		});

		const junctionFieldRelated = computed({
			get() {
				return props.newRelations[1]?.field_many || null;
			},
			set(newJunctionField: string | null) {
				let relations: readonly Partial<Relation>[];

				if (_newRelations.value.length === 0) relations = [...defaultNewRelations.value];
				else relations = [..._newRelations.value];

				relations[1].field_many = newJunctionField || undefined;
				relations[0].junction_field = newJunctionField || undefined;
				_newRelations.value = relations;
			},
		});

		return {
			availableCollections,
			collectionItems,
			junctionCollection,
			junctionFields,
			relatedCollection,
			junctionFieldCurrent,
			junctionFieldRelated,
		};
	},
});
</script>

<style lang="scss" scoped>
.grid {
	position: relative;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20px;
	margin-top: 48px;

	.v-icon {
		--v-icon-color: var(--foreground-subdued);

		position: absolute;
		transform: translateX(-50%);

		&:first-of-type {
			bottom: 85px;
			left: 32.8%;
		}

		&:last-of-type {
			bottom: 14px;
			left: 67%;
		}
	}
}
</style>
