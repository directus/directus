<template>
	<div>
		<h2 class="type-title">{{ $t('configure_m2o') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="_relations[0].collection_many" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-select
					:placeholder="$t('choose_a_collection')"
					:items="items"
					v-model="_relations[0].collection_one"
				/>
			</div>
			<v-input disabled :value="fieldData.field" />
			<v-input disabled :value="relatedPrimary" />
			<v-icon name="arrow_back" />
		</div>

		<v-divider />

		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('create_corresponding_field') }}</div>
				<v-checkbox block :label="$t('add_field_related')" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('corresponding_field_name') }}</div>
				<v-input />
			</div>
			<v-icon name="arrow_forward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation } from '@/stores/relations/types';
import { orderBy } from 'lodash';
import useSync from '@/composables/use-sync';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';

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

		const items = computed(() =>
			availableCollections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}))
		);

		const relatedPrimary = computed(() => {
			return _relations.value[0].collection_one
				? fieldsStore.getPrimaryKeyFieldForCollection(_relations.value[0].collection_one)?.field
				: null;
		});

		return { _relations, items, relatedPrimary };
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

.type-label {
	margin-bottom: 8px;
}
</style>
