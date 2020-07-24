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
import { defineComponent, PropType, computed, watch } from '@vue/composition-api';
import { Relation } from '@/stores/relations/types';
import { Field } from '@/stores/fields/types';
import { orderBy } from 'lodash';
import useSync from '@/composables/use-sync';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
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

		const { items, relatedPrimary } = useRelation();
		const { hasCorresponding, correspondingField, correspondingLabel } = useCorresponding();

		return {
			_relations,
			_newFields,
			items,
			relatedPrimary,
			hasCorresponding,
			correspondingField,
			correspondingLabel,
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
				return _relations.value[0].collection_one
					? fieldsStore.getPrimaryKeyFieldForCollection(_relations.value[0].collection_one)?.field
					: null;
			});

			return { items, relatedPrimary };
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
								field: '',
								collection: _relations.value[0].collection_one,
								system: {
									special: 'o2m',
									interface: 'one-to-many',
								},
							},
						];
					} else {
						_newFields.value = [];
					}
				},
			});

			const correspondingField = computed({
				get() {
					return _newFields.value?.[0]?.field || null;
				},
				set(field: string | null) {
					_newFields.value = [
						{
							...(_newFields.value[0] || {}),
							field: field || '',
						},
					];

					_relations.value = [
						{
							..._relations.value[0],
							field_one: field,
						},
					];
				},
			});

			const correspondingLabel = computed(() => {
				if (_relations.value[0].collection_one) {
					return i18n.t('add_o2m_to_collection', { collection: _relations.value[0].collection_one });
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
