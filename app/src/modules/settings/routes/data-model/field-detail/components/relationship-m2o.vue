<template>
	<div>
		<h2 class="type-title">{{ $t('configure_m2o') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="relations[0].many_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-select
					:placeholder="$t('choose_a_collection')"
					:items="items"
					v-model="relations[0].one_collection"
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
				<v-checkbox block :label="correspondingLabel" v-model="hasCorresponding" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('corresponding_field_name') }}</div>
				<v-input :disabled="hasCorresponding === false" v-model="correspondingField" />
			</div>
			<v-icon name="arrow_forward" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from '@vue/composition-api';
import { Relation } from '@/types';
import { Field } from '@/types';
import { orderBy } from 'lodash';
import useSync from '@/composables/use-sync';
import { useCollectionsStore, useFieldsStore } from '@/stores';
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

		const { items, relatedPrimary } = useRelation();
		const { hasCorresponding, correspondingField, correspondingLabel } = useCorresponding();

		return {
			relations: state.relations,
			items,
			relatedPrimary,
			hasCorresponding,
			correspondingField,
			correspondingLabel,
			fieldData: state.fieldData,
		};

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

			const relatedPrimary = computed(() => {
				return state.relations[0].one_collection
					? fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].one_collection)?.field
					: null;
			});

			return { items, relatedPrimary };
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					return state.newFields.length > 0;
				},
				set(enabled: boolean) {
					if (enabled === true) {
						state.newFields = [
							{
								field: '',
								collection: state.relations[0].one_collection,
								system: {
									special: 'o2m',
									interface: 'one-to-many',
								},
							},
						];
					} else {
						state.newFields = [];
					}
				},
			});

			const correspondingField = computed({
				get() {
					return state.newFields?.[0]?.field || null;
				},
				set(field: string | null) {
					state.newFields = [
						{
							...(state.newFields[0] || {}),
							field: field || '',
						},
					];

					state.relations = [
						{
							...state.relations[0],
							one_field: field,
						},
					];
				},
			});

			const correspondingLabel = computed(() => {
				if (state.relations[0].one_collection) {
					return i18n.t('add_o2m_to_collection', { collection: state.relations[0].one_collection });
				}

				return i18n.t('add_field_related');
			});

			return { hasCorresponding, correspondingField, correspondingLabel };
		}
	},
});
</script>

<style lang="scss" scoped>
.grid {
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

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

.v-divider {
	margin: 48px 0;
}

.type-label {
	margin-bottom: 8px;
}
</style>
