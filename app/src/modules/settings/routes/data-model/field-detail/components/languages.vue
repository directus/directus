<template>
	<div>
		<h2 class="type-title">{{ $t('configure_languages') }}</h2>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('translations_collection') }}</div>
				<v-input disabled :value="relations[1].many_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('languages_collection') }}</div>
				<v-input :class="{ matches: languagesCollectionExists }" db-safe key="languages-collection" v-model="relations[1].one_collection" :disabled="isExisting" :placeholder="$t('collection') + '...'">
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" :disabled="isExisting" />
							</template>

							<v-list dense class="monospace">
								<v-list-item
									v-for="item in items"
									:key="item.value"
									:active="relations[1].one_collection === item.value"
									:disabled="item.disabled"
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
			<v-input :value="relations[1].many_field" :placeholder="$t('foreign_key') + '...'"/>
			<v-input db-safe :disabled="languagesCollectionExists" v-model="relations[1].one_primary" :placeholder="$t('primary_key') + '...'" />
			<v-icon class="arrow" name="arrow_back" />
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
		isExisting: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { items } = useRelation();

		const languagesCollectionExists = computed(() => {
			return !!collectionsStore.getCollection(state.relations[1].one_collection);
		});

		return {
			relations: state.relations,
			items,
			fieldData: state.fieldData,
			languagesCollectionExists,
		};

		function useRelation() {
			const availableCollections = computed(() => {
				return orderBy(
					collectionsStore.state.collections.filter((collection) => {
						return collection.collection.startsWith('directus_') === false;
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

			return { items };
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

	.arrow {
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

.v-divider {
	margin: 48px 0;
}

.type-label {
	margin-bottom: 8px;
}
</style>
