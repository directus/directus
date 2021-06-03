<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="relations[0].collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-input
					:class="{ matches: relatedCollectionExists }"
					db-safe
					key="related-collection"
					v-model="relations[0].related_collection"
					:nullable="false"
					:disabled="isExisting"
					:placeholder="$t('collection') + '...'"
				>
					<template #append v-if="!isExisting">
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" :disabled="isExisting" />
							</template>

							<v-list class="monospace">
								<v-list-item
									v-for="collection in availableCollections"
									:key="collection.collection"
									:active="relations[0].related_collection === collection.collection"
									@click="relations[0].related_collection = collection.collection"
								>
									<v-list-item-content>
										{{ collection.collection }}
									</v-list-item-content>
								</v-list-item>

								<v-divider />

								<v-list-group>
									<template #activator>{{ $t('system') }}</template>
									<v-list-item
										v-for="collection in systemCollections"
										:key="collection.collection"
										:active="relations[0].related_collection === collection.collection"
										@click="relations[0].related_collection = collection.collection"
									>
										<v-list-item-content>
											{{ collection.collection }}
										</v-list-item-content>
									</v-list-item>
								</v-list-group>
							</v-list>
						</v-menu>
					</template>

					<template #input v-if="isExisting">
						<v-text-overflow :text="relations[0].related_collection" />
					</template>
				</v-input>
			</div>
			<v-input disabled>
				<template #input>
					<v-text-overflow :text="relations[0].field" />
				</template>
			</v-input>
			<v-input v-model="relatedPrimaryKeyField" disabled :placeholder="$t('primary_key') + '...'" />
			<v-icon class="arrow" name="arrow_back" />
		</div>

		<v-divider large :inline-title="false" v-if="!isExisting">{{ $t('corresponding_field') }}</v-divider>

		<div class="grid" v-if="!isExisting">
			<div class="field">
				<div class="type-label">{{ $t('create_field') }}</div>
				<v-checkbox block :label="correspondingLabel" v-model="hasCorresponding" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('field_name') }}</div>
				<v-input
					:disabled="hasCorresponding === false"
					v-model="correspondingField"
					:placeholder="$t('field_name') + '...'"
					db-safe
				/>
			</div>
			<v-icon name="arrow_forward" class="arrow" />
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ $t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						$t('referential_action_field_label_m2o', {
							collection: relatedCollectionName || 'related',
						})
					}}
				</div>
				<v-select
					v-model="relations[0].schema.on_delete"
					:disabled="relations[0].collection === relations[0].related_collection"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: $t('referential_action_set_null', { field: m2oFieldName }),
							value: 'SET NULL',
						},
						{
							text: $t('referential_action_set_default', { field: m2oFieldName }),
							value: 'SET DEFAULT',
						},
						{
							text: $t('referential_action_cascade', {
								collection: currentCollectionName,
								field: m2oFieldName,
							}),
							value: 'CASCADE',
						},
						{
							text: $t('referential_action_no_action', {
								field: m2oFieldName,
							}),
							value: 'NO ACTION',
						},
					]"
				/>
			</div>
		</div>

		<v-notice class="generated-data" v-if="generationInfo.length > 0" type="warning">
			<span>
				{{ $t('new_data_alert') }}

				<ul>
					<li v-for="(data, index) in generationInfo" :key="index">
						<span class="field-name">{{ data.name }}</span>
						({{ $t(data.type === 'field' ? 'new_field' : 'new_collection') }})
					</li>
				</ul>
			</span>
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { orderBy } from 'lodash';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import i18n from '@/lang';
import formatTitle from '@directus/format-title';

import { state, generationInfo } from '../store';

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
	setup() {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { availableCollections, systemCollections } = useRelation();
		const { hasCorresponding, correspondingField, correspondingLabel } = useCorresponding();

		const relatedCollectionExists = computed(() => {
			return (
				state.relations[0].related_collection && !!collectionsStore.getCollection(state.relations[0].related_collection)
			);
		});

		const relatedPrimaryKeyField = computed(() => {
			if (!state.relations[0].related_collection) return '';

			if (relatedCollectionExists.value) {
				return fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].related_collection).field;
			}

			return 'id';
		});

		const relatedCollectionName = computed(() => {
			if (!state.relations[0].related_collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].related_collection)?.name ||
				formatTitle(state.relations[0].related_collection)
			);
		});

		const currentCollectionName = computed(() => {
			if (!state.relations[0].collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].collection)?.name ||
				formatTitle(state.relations[0].collection)
			);
		});

		const m2oFieldName = computed(() => {
			if (!state.relations[0].collection || !state.relations[0].field) return null;
			return (
				fieldsStore.getField(state.relations[0].collection, state.relations[0].field)?.name ||
				formatTitle(state.relations[0].field)
			);
		});

		return {
			relations: state.relations,
			availableCollections,
			systemCollections,
			hasCorresponding,
			correspondingField,
			correspondingLabel,
			fieldData: state.fieldData,
			relatedCollectionExists,
			generationInfo,
			relatedPrimaryKeyField,
			relatedCollectionName,
			m2oFieldName,
			currentCollectionName,
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

			/**
			 * These are the system endpoints that don't have full/regular CRUD operations available.
			 */
			const collectionsDenyList = [
				'directus_activity',
				'directus_collections',
				'directus_fields',
				'directus_migrations',
				'directus_relations',
				'directus_revisions',
				'directus_sessions',
				'directus_settings',
			];

			const systemCollections = computed(() => {
				return orderBy(
					collectionsStore.state.collections.filter((collection) => {
						return collection.collection.startsWith('directus_') === true;
					}),
					['collection'],
					['asc']
				).filter((collection) => collectionsDenyList.includes(collection.collection) === false);
			});

			return { availableCollections, systemCollections };
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					return state.newFields.length > 0;
				},
				set(enabled: boolean) {
					if (enabled === true) {
						state.relations[0].meta = {
							...(state.relations[0].meta || {}),
							one_field: state.relations[0].collection,
						};

						state.newFields.push({
							$type: 'corresponding',
							field: state.relations[0].meta.one_field!,
							collection: state.relations[0].related_collection!,
							meta: {
								special: ['o2m'],
								interface: 'list-o2m',
							},
						});
					} else {
						state.newFields = state.newFields.filter((field: any) => field.$type !== 'corresponding');
					}
				},
			});

			const correspondingField = computed({
				get() {
					return state.newFields?.find((field: any) => field.$type === 'corresponding')?.field || null;
				},
				set(field: string | null) {
					state.newFields = state.newFields.map((newField: any) => {
						if (newField.$type === 'corresponding') {
							return {
								...newField,
								field,
							};
						}

						return newField;
					});

					state.relations[0].meta = {
						...(state.relations[0].meta || {}),
						one_field: field,
					};
				},
			});

			const correspondingLabel = computed(() => {
				if (state.relations[0].related_collection) {
					return i18n.t('add_o2m_to_collection', { collection: state.relations[0].related_collection });
				}

				return i18n.t('add_field_related');
			});

			return { hasCorresponding, correspondingField, correspondingLabel };
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

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
		bottom: 17px;
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

.v-notice {
	margin-bottom: 36px;
}

.generated-data {
	margin-top: 36px;

	ul {
		padding-top: 4px;
		padding-left: 24px;
	}

	.field-name {
		font-family: var(--family-monospace);
	}
}

.relational-triggers {
	--form-horizontal-gap: 12px;
	--form-vertical-gap: 24px;

	@include form-grid;

	.v-divider {
		margin-top: 48px;
		margin-bottom: 0;
	}
}
</style>
