<template>
	<div>
		<h2 class="type-title">{{ $t('configure_o2m') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-select :placeholder="$t('choose_a_collection')" :items="items" v-model="collectionMany" />
			</div>
			<v-input disabled :value="currentCollectionPrimaryKey.field" />
			<v-select
				v-model="_relations[0].field_many"
				:disabled="!_relations[0].collection_many"
				:items="fields"
				:placeholder="!_relations[0].collection_many ? $t('choose_a_collection') : $t('choose_a_field')"
			/>
			<v-icon name="arrow_forward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation } from '@/stores/relations/types';
import { Field } from '@/stores/fields/types';
import useSync from '@/composables/use-sync';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
import { orderBy } from 'lodash';
import i18n from '@/lang';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			required: true,
		},
		newFields: {
			type: Array as PropType<DeepPartial<Field>[]>,
			required: true,
		},
		fieldData: {
			type: Object,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _relations = useSync(props, 'relations', emit);
		const _newFields = useSync(props, 'newFields', emit);

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { items, fields, currentCollectionPrimaryKey, collectionMany } = useRelation();

		return { _relations, items, fields, currentCollectionPrimaryKey, collectionMany };

		function useRelation() {
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

			const items = computed(() =>
				availableCollections.value.map((collection) => ({
					text: collection.collection,
					value: collection.collection,
				}))
			);

			const currentCollectionPrimaryKey = computed(() =>
				fieldsStore.getPrimaryKeyFieldForCollection(props.collection)
			);

			const fields = computed(() => {
				if (!_relations.value[0].collection_many) return [];

				return fieldsStore.state.fields
					.filter((field) => {
						if (field.collection !== _relations.value[0].collection_many) return false;

						// Make sure the selected field matches the type of primary key of the current
						// collection. Otherwise you aren't able to properly save the primary key
						if (!field.database || field.database.type !== currentCollectionPrimaryKey.value.database.type)
							return false;

						return true;
					})
					.map((field) => field.field);
			});

			const collectionMany = computed({
				get() {
					return _relations.value[0].collection_many;
				},
				set(collection: string) {
					_relations.value[0].collection_many = collection;
					_relations.value[0].field_many = '';
				},
			});

			return { availableCollections, items, fields, currentCollectionPrimaryKey, collectionMany };
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					return _newFields.value.length > 0;
				},
				set(enabled: boolean) {
					if (enabled === true) {
						_newFields.value = [
							{
								field: _relations.value[0].field_many,
								collection: _relations.value[0].collection_many,
								system: {
									interface: 'many-to-one',
								},
							},
						];
					} else {
						_newFields.value = [];
					}
				},
			});

			const correspondingLabel = computed(() => {
				if (_relations.value[0].collection_many) {
					return i18n.t('add_m2o_to_collection', { collection: _relations.value[0].collection_many });
				}

				return i18n.t('add_field_related');
			});

			return { hasCorresponding, correspondingLabel };
		}
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

.type-label {
	margin-bottom: 8px;
}
</style>
