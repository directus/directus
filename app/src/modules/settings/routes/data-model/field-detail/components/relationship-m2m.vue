<template>
	<div>
		<h2 class="type-title">{{ $t('configure_m2m') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="relations[0].one_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('junction_collection') }}</div>
				<v-input v-model="junctionCollection" :placeholder="$t('collection') + '...'" :disabled="isExisting" db-safe>
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
							</template>

							<v-list dense class="monospace">
								<v-list-item
									v-for="item in collectionItems"
									:key="item.value"
									:active="relations[0].many_collection === item.value"
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
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-input v-model="relations[1].one_collection" :placeholder="$t('collection') + '...'" :disabled="type === 'files' || isExisting" db-safe>
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
							</template>

							<v-list dense class="monospace">
								<v-list-item
									v-for="item in collectionItems"
									:key="item.value"
									:active="relations[1].one_collection === item.value"
									@click="relations[1].one_collection = item.value"
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
			<v-input disabled :value="relations[0].one_primary" />
			<v-input v-model="relations[0].many_field" :placeholder="$t('foreign_key') + '...'" :disabled="isExisting" db-safe>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list dense class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].many_field === item.value"
								@click="relations[0].many_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<div class="spacer" />
			<div class="spacer" />
			<v-input v-model="relations[1].many_field" :placeholder="$t('foreign_key') + '...'" :disabled="isExisting" db-safe>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list dense class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[1].many_field === item.value"
								@click="relations[1].many_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<v-input db-safe :disabled="relatedCollectionExists" v-model="relations[1].one_primary" :placeholder="$t('primary_key') + '...'" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_backward" />
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
		isExisting: {
			type: Boolean,
			default: false,
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

		const junctionCollectionExists = computed(() => {
			return collectionsStore.getCollection(junctionCollection.value) !== null;
		});

		const relatedCollectionExists = computed(() => {
			return collectionsStore.getCollection(state.relations[1].one_collection) !== null;
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore.getFieldsForCollection(junctionCollection.value).map((field: Field) => ({
				text: field.field,
				value: field.field,
				disabled:
					state.relations[0].many_field === field.field ||
					field.schema?.is_primary_key ||
					state.relations[1].many_field === field.field,
			}));
		});

		return { relations: state.relations, collectionItems, junctionCollection, junctionFields, junctionCollectionExists, relatedCollectionExists };
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
	gap: 12px 28px;
	margin-top: 48px;

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		&:first-of-type {
			bottom: 78px;
			left: 32.7%;
		}

		&:last-of-type {
			bottom: 14px;
			left: 67.5%;
		}
	}
}

.type-label {
	margin-bottom: 8px;
}
</style>
