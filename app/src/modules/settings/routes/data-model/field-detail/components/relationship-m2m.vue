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
				<v-select :disabled="type === 'files'" :items="collectionItems" v-model="relations[1].one_collection" />
			</div>
			<v-input disabled :value="relations[0].one_primary" />
			<v-select :disabled="!junctionCollection" :items="junctionFields" v-model="relations[0].many_field" />
			<div class="spacer" />
			<div class="spacer" />
			<v-select :disabled="!junctionCollection" :items="junctionFields" v-model="relations[1].many_field" />
			<v-input disabled :value="relations[1].one_primary" />
			<v-icon name="arrow_forward" />
			<v-icon name="arrow_backward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { orderBy } from 'lodash';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { Field } from '@/types';

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
	setup(props) {
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
				return state.relations[0].many_collection;
			},
			set(collection: string) {
				state.relations[0].many_collection = collection;
				state.relations[1].many_collection = collection;
			},
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore.getFieldsForCollection(junctionCollection.value).map((field: Field) => ({
				text: field.field,
				value: field.field,
				disabled:
					state.relations[0].many_field === field.field || state.relations[1].many_field === field.field,
			}));
		});

		return { relations: state.relations, collectionItems, junctionCollection, junctionFields };
	},
});
</script>

<style lang="scss" scoped>
.grid {
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

	position: relative;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
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
