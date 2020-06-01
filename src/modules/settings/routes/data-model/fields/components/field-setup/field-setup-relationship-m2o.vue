<template>
	<div>
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
					:items="items"
					v-model="collectionOne"
				/>
				<v-input disabled v-else :value="existingRelation.collection_many" />
			</div>
			<v-input disabled :value="field.field" />
			<v-input disabled value="id" />
			<v-icon name="arrow_back" />
		</div>

		<v-divider />

		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('create_corresponding_field') }}</div>
				<v-checkbox block :disabled="isNew === false" :label="$t('add_field_related')" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('corresponding_field_name') }}</div>
				<v-input :disabled="isNew === false" />
			</div>
			<v-icon name="arrow_forward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import orderBy from 'lodash/orderBy';
import { Field } from '@/stores/fields/types';
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
			required: true,
		},
	},
	setup(props, { emit }) {
		const _newRelations = useSync(props, 'newRelations', emit);
		const collectionsStore = useCollectionsStore();

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
				text: collection.name,
				value: collection.collection,
			}))
		);

		const existingRelation = computed(() => {
			return props.existingRelations.find((relation) => {
				return relation.field_many === props.field.field && relation.collection_many === props.field.collection;
			});
		});

		const collectionOne = computed({
			get() {
				return _newRelations.value[0]?.collection_one || null;
			},
			set(newCollectionOne: string | null) {
				_newRelations.value = [
					{
						field_many: props.field.field,
						collection_many: props.field.collection,
						collection_one: newCollectionOne || undefined,
					},
				];
			},
		});

		return { availableCollections, items, existingRelation, collectionOne };
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

.v-divider {
	margin: 48px 0;
}
</style>
