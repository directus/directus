<template>
	<div class="grid">
		<div class="field">
			<div class="type-label">{{ $t('this_collection') }}</div>
			<v-input disabled :value="collection" />
		</div>
		<div class="field">
			<div class="type-label">{{ $t('junction_collection') }}</div>
			<v-select :items="collectionItems" />
		</div>
		<div class="field">
			<div class="type-label">{{ $t('related_collection') }}</div>
			<v-select :items="collectionItems" />
		</div>
		<v-input disabled :value="field.field" />
		<v-select :items="collectionItems" allow-other />
		<div class="spacer" />
		<div class="spacer" />
		<v-select :items="collectionItems" allow-other />
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

		const collectionItems = computed(() =>
			availableCollections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}))
		);

		return { availableCollections, collectionItems };
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
