<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-select :items="items" />
			</div>
			<v-input disabled :value="field.field" />
			<v-input disabled value="id" />
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
import { defineComponent, computed, PropType } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import orderBy from 'lodash/orderBy';
import { Field } from '@/stores/fields/types';

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
	},
	setup(props) {
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

		return { availableCollections, items };
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
