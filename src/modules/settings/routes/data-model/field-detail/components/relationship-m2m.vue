<template>
	<div>
		<h2 class="type-title">{{ $t('configure_m2m') }}</h2>
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
				<v-select
					:disabled="type === 'files'"
					:items="collectionItems"
					v-model="_relations[1].collection_one"
				/>
			</div>
			<v-input disabled :value="_relations[0].primary_one" />
			<v-select :disabled="!junctionCollection" :items="junctionFields" v-model="_relations[0].field_many" />
			<div class="spacer" />
			<div class="spacer" />
			<v-select :disabled="!junctionCollection" :items="junctionFields" v-model="_relations[1].field_many" />
			<v-input disabled :value="_relations[1].primary_one" />
			<v-icon name="arrow_forward" />
			<v-icon name="arrow_backward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import { orderBy } from 'lodash';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
import { Relation } from '@/stores/relations/types';
import useSync from '@/composables/use-sync';
import { Field } from '@/stores/fields/types';

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
				text: collection.collection,
				value: collection.collection,
			}))
		);

		const junctionCollection = computed({
			get() {
				return _relations.value[0].collection_many;
			},
			set(collection: string) {
				_relations.value[0].collection_many = collection;
				_relations.value[1].collection_many = collection;
			},
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore.getFieldsForCollection(junctionCollection.value).map((field: Field) => ({
				text: field.field,
				value: field.field,
			}));
		});

		return { _relations, collectionItems, junctionCollection, junctionFields };
	},
});
</script>

<style lang="scss" scoped>
.grid {
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

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

.type-label {
	margin-bottom: 8px;
}
</style>
