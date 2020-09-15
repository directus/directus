<template>
	<div>
		<h2 class="type-title">{{ $t('configure_translations') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('translations_collection') }}</div>
				<v-input
					db-safe
					:placeholder="$t('collection') + '...'"
					v-model="relations[0].many_collection"
					:disabled="isExisting"
					:class="{ matches: translationsCollectionExists }"
				>
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" :disabled="isExisting" />
							</template>

							<v-list dense class="monospace">
								<v-list-item
									v-for="item in items"
									:key="item.value"
									:active="relations[0].many_collection === item.value"
									:disabled="item.disabled"
									@click="relations[0].many_collection = item.value"
								>
									<v-list-item-content>
										{{ item.text }}
									</v-list-item-content>
								</v-list-item>
							</v-list>
						</v-menu>
					</template>
				</v-input>
			</div>
			<v-input disabled :value="currentCollectionPrimaryKey.field" />
			<v-input
				db-safe
				v-model="relations[0].many_field"
				:disabled="isExisting"
				:placeholder="$t('foreign_key') + '...'"
				:class="{ matches: translationsFieldExists }"
			>
				<template #append v-if="fields && fields.length > 0">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list dense class="monospace">
							<v-list-item
								v-for="field in fields"
								:key="field.value"
								:active="relations[0].many_field === field.value"
								@click="relations[0].many_field = field.value"
								:disabled="field.disabled"
							>
								<v-list-item-content>
									{{ field.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<v-icon class="arrow" name="arrow_forward" />
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
		isExisting: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { items, fields, currentCollectionPrimaryKey, collectionMany } = useRelation();

		const translationsCollectionExists = computed(() => {
			return collectionsStore.state.collections.find((col) => col.collection === state.relations?.[0].many_collection);
		});

		const translationsFieldExists = computed(() => {
			if (!state?.relations?.[0].many_collection || !state?.relations?.[0].many_field) return false;
			return !!fieldsStore.getField(state.relations[0].many_collection, state.relations[0].many_field);
		});

		return { relations: state.relations, items, fields, currentCollectionPrimaryKey, collectionMany, translationsCollectionExists, translationsFieldExists };

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
					.filter((field) => field.collection === state.relations[0].many_collection)
					.map((field) => ({
						text: field.field,
						value: field.field,
						disabled:
							!field.schema ||
							field.schema?.is_primary_key ||
							field.type !== currentCollectionPrimaryKey.value.type,
					}));
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
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-top: 48px;

	.v-input.matches {
		--v-input-color: var(--primary);
	}

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
	}
}

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
}

.type-label {
	margin-bottom: 8px;
}

.v-divider {
	margin: 48px 0;
}

.corresponding {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-top: 48px;

	.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
	}
}
</style>
