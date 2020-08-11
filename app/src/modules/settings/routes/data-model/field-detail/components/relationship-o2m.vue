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
				v-model="relations[0].many_field"
				:disabled="!relations[0].many_collection"
				:items="fields"
				:placeholder="!relations[0].many_collection ? $t('choose_a_collection') : $t('choose_a_field')"
			/>
			<v-icon name="arrow_forward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation, Field } from '@/types';
import useSync from '@/composables/use-sync';
import { useFieldsStore, useCollectionsStore } from '@/stores';
import { orderBy } from 'lodash';
import i18n from '@/lang';

import { state } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { items, fields, currentCollectionPrimaryKey, collectionMany } = useRelation();

		return { relations: state.relations, items, fields, currentCollectionPrimaryKey, collectionMany };

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
				if (!state.relations[0].many_collection) return [];

				return fieldsStore.state.fields
					.filter((field) => {
						if (field.collection !== state.relations[0].many_collection) return false;

						// Make sure the selected field matches the type of primary key of the current
						// collection. Otherwise you aren't able to properly save the primary key
						if (!field.schema || field.type !== currentCollectionPrimaryKey.value.type) return false;

						return true;
					})
					.map((field) => field.field);
			});

			const collectionMany = computed({
				get() {
					return state.relations[0].many_collection!;
				},
				set(collection: string) {
					state.relations[0].many_collection = collection;
					state.relations[0].many_field = '';
				},
			});

			return { availableCollections, items, fields, currentCollectionPrimaryKey, collectionMany };
		}
	},
});
</script>

<style lang="scss" scoped>
.grid {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
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
