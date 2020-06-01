<template>
	<div class="grid">
		<div class="field">
			<div class="type-label">{{ $t('this_collection') }}</div>
			<v-input disabled :value="collection" />
		</div>
		<div class="field">
			<div class="type-label">{{ $t('related_collection') }}</div>
			<v-select
				v-if="isNew"
				:placeholder="$t('choose_a_collection')"
				:items="collectionItems"
				v-model="collectionMany"
			/>
			<v-input disabled v-else :value="existingRelation.collection_many" />
		</div>
		<v-input disabled :value="field.field" />
		<v-select
			v-if="isNew"
			:disabled="!collectionMany"
			:items="collectionFields"
			v-model="fieldMany"
			:placeholder="!collectionMany ? $t('choose_a_collection') : $t('choose_a_field')"
		/>
		<v-input disabled v-else :value="existingRelation.field_many" />
		<v-icon name="arrow_forward" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import orderBy from 'lodash/orderBy';
import { Field } from '@/stores/fields/types';
import { Relation } from '@/stores/relations/types';
import useSync from '@/composables/use-sync';
import useFieldsStore from '@/stores/fields';

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
		existingRelations: {
			type: Array as PropType<Relation[]>,
			required: true,
		},
		newRelations: {
			type: Array as PropType<Partial<Relation>[]>,
			required: true,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const _newRelations = useSync(props, 'newRelations', emit);

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

		const existingRelation = computed(() => {
			return props.existingRelations.find((relation) => {
				return relation.field_one === props.field.field && relation.collection_one === props.field.collection;
			});
		});

		const defaultNewRelation = computed(() => ({
			collection_one: props.field.collection,
			field_one: props.field.field,
		}));

		const collectionMany = computed({
			get() {
				return props.newRelations[0]?.collection_many || null;
			},
			set(newCollectionOne: string | null) {
				_newRelations.value = [
					{
						...(props.newRelations[0] || defaultNewRelation.value),
						collection_many: newCollectionOne || undefined,
					},
				];
			},
		});

		const fieldMany = computed({
			get() {
				return props.newRelations[0]?.field_many || null;
			},
			set(newCollectionOne: string | null) {
				_newRelations.value = [
					{
						...(props.newRelations[0] || defaultNewRelation),
						field_many: newCollectionOne || undefined,
					},
				];
			},
		});

		const collectionFields = computed(() => {
			if (!collectionMany.value) return [];
			return fieldsStore.getFieldsForCollection(collectionMany.value).map((field: Field) => ({
				text: field.name,
				value: field.field,
			}));
		});

		return {
			availableCollections,
			collectionItems,
			collectionMany,
			fieldMany,
			existingRelation,
			collectionFields,
		};
	},
});
</script>

<style lang="scss" scoped>
.grid {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20px 32px;
	margin-top: 48px;

	.v-icon {
		--v-icon-color: var(--foreground-subdued);

		position: absolute;
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
	}
}
</style>
