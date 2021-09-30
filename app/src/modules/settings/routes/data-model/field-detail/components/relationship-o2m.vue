<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ t('this_collection') }}</div>
				<v-input disabled :model-value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('related_collection') }}</div>
				<v-input
					v-model="relations[0].collection"
					db-safe
					:placeholder="t('collection') + '...'"
					:nullable="false"
					:disabled="isExisting"
					:class="{ matches: relatedCollectionExists }"
				>
					<template v-if="!isExisting" #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon
									v-tooltip="t('select_existing')"
									name="list_alt"
									clickable
									:disabled="isExisting"
									@click="toggle"
								/>
							</template>

							<v-list class="monospace">
								<v-list-item
									v-for="availableCollection in availableCollections"
									:key="availableCollection.collection"
									:active="relations[0].collection === availableCollection.collection"
									clickable
									@click="relations[0].collection = availableCollection.collection"
								>
									<v-list-item-content>
										{{ availableCollection.collection }}
									</v-list-item-content>
								</v-list-item>

								<v-divider />

								<v-list-group>
									<template #activator>{{ t('system') }}</template>
									<v-list-item
										v-for="systemCollection in systemCollections"
										:key="systemCollection.collection"
										:active="relations[0].collection === systemCollection.collection"
										clickable
										@click="relations[0].collection = systemCollection.collection"
									>
										<v-list-item-content>
											{{ systemCollection.collection }}
										</v-list-item-content>
									</v-list-item>
								</v-list-group>
							</v-list>
						</v-menu>
					</template>

					<template v-if="isExisting" #input>
						<v-text-overflow :text="relations[0].collection" />
					</template>
				</v-input>
			</div>
			<v-input disabled :model-value="currentCollectionPrimaryKey.field">
				<template #input>
					<v-text-overflow :text="currentCollectionPrimaryKey.field" />
				</template>
			</v-input>
			<v-input
				v-model="relations[0].field"
				db-safe
				:nullable="false"
				:disabled="isExisting"
				:placeholder="t('foreign_key') + '...'"
				:class="{ matches: relatedFieldExists }"
			>
				<template v-if="fields && fields.length > 0 && !isExisting" #append>
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon v-tooltip="t('select_existing')" name="list_alt" clickable @click="toggle" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="field in fields"
								:key="field.value"
								:active="relations[0].field === field.value"
								:disabled="field.disabled"
								clickable
								@click="relations[0].field = field.value"
							>
								<v-list-item-content>
									{{ field.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>

				<template v-if="isExisting" #input>
					<v-text-overflow :text="relations[0].field" />
				</template>
			</v-input>
			<v-icon class="arrow" name="arrow_forward" />
		</div>

		<v-divider v-if="!isExisting" large :inline-title="false">{{ t('corresponding_field') }}</v-divider>

		<div v-if="!isExisting" class="corresponding">
			<div class="field">
				<div class="type-label">{{ t('create_field') }}</div>
				<v-checkbox v-model="hasCorresponding" block :disabled="isExisting" :label="correspondingLabel" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('field_name') }}</div>
				<v-input v-model="relations[0].field" disabled :placeholder="t('field_name') + '...'" db-safe />
			</div>
			<v-icon name="arrow_forward" class="arrow" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ t('sort_field') }}</v-divider>

			<v-input
				v-model="relations[0].meta.sort_field"
				db-safe
				:placeholder="t('add_sort_field') + '...'"
				:class="{ matches: sortFieldExists }"
			>
				<template v-if="fields && fields.length > 0 && !isExisting" #append>
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon v-tooltip="t('select_existing')" name="list_alt" clickable @click="toggle" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="field in fields"
								:key="field.value"
								:active="relations[0].meta.sort_field === field.value"
								clickable
								:disabled="field.disabled"
								@click="relations[0].meta.sort_field = field.value"
							>
								<v-list-item-content>
									{{ field.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_o2m', {
							collection: relatedCollectionName || 'related',
						})
					}}
				</div>
				<v-select
					v-model="relations[0].meta.one_deselect_action"
					:placeholder="t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: m2oFieldName }),
							value: 'nullify',
						},
						{
							text: t('referential_action_cascade', {
								collection: relatedCollectionName,
								field: m2oFieldName,
							}),
							value: 'delete',
						},
					]"
				/>
			</div>

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_m2o', {
							collection: currentCollectionName || 'related',
						})
					}}
				</div>
				<v-select
					v-model="relations[0].schema.on_delete"
					:disabled="relations[0].collection === relations[0].related_collection"
					:placeholder="t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: m2oFieldName }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: m2oFieldName }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: currentCollectionName,
								field: m2oFieldName,
							}),
							value: 'CASCADE',
						},
						{
							text: t('referential_action_no_action'),
							value: 'NO ACTION',
						},
					]"
				/>
			</div>
		</div>

		<v-notice v-if="generationInfo.length > 0" class="generated-data" type="warning">
			<span>
				{{ t('new_data_alert') }}

				<ul>
					<li v-for="(data, index) in generationInfo" :key="index">
						<span class="field-name">{{ data.name }}</span>
						({{ t(data.type === 'field' ? 'new_field' : 'new_collection') }})
					</li>
				</ul>
			</span>
		</v-notice>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { Field } from '@directus/shared/types';
import { useFieldsStore, useCollectionsStore } from '@/stores';
import { orderBy } from 'lodash';
import { state, generationInfo } from '../store';
import formatTitle from '@directus/format-title';

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
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { availableCollections, systemCollections, fields, currentCollectionPrimaryKey, collectionMany } =
			useRelation();
		const { hasCorresponding, correspondingLabel } = useCorresponding();

		const relatedCollectionExists = computed(() => {
			return (
				collectionsStore.collections.find((col) => col.collection === state.relations?.[0].collection) !== undefined
			);
		});

		const relatedFieldExists = computed(() => {
			if (!state?.relations?.[0].collection || !state?.relations?.[0].field) return false;
			return !!fieldsStore.getField(state.relations[0].collection, state.relations[0].field);
		});

		const sortFieldExists = computed(() => {
			if (!state?.relations?.[0].collection || !state?.relations?.[0].meta?.sort_field) return false;
			return !!fieldsStore.getField(state.relations[0].collection, state.relations[0].meta.sort_field);
		});

		const relatedCollectionName = computed(() => {
			if (!state.relations[0].collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].collection)?.name ||
				formatTitle(state.relations[0].collection)
			);
		});

		const currentCollectionName = computed(() => {
			if (!state.relations[0].related_collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].related_collection)?.name ||
				formatTitle(state.relations[0].related_collection)
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
			t,
			relations: state.relations,
			availableCollections,
			systemCollections,
			fields,
			currentCollectionPrimaryKey,
			collectionMany,
			hasCorresponding,
			correspondingLabel,
			relatedCollectionExists,
			relatedFieldExists,
			generationInfo,
			sortFieldExists,
			relatedCollectionName,
			currentCollectionName,
			m2oFieldName,
		};

		function useRelation() {
			const availableCollections = computed(() => {
				return orderBy(
					collectionsStore.collections.filter((collection) => {
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
					collectionsStore.collections.filter((collection) => {
						return collection.collection.startsWith('directus_') === true;
					}),
					['collection'],
					['asc']
				).filter((collection) => collectionsDenyList.includes(collection.collection) === false);
			});

			const currentCollectionPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection));

			const fields = computed(() => {
				if (!state.relations[0].collection) return [];

				return fieldsStore.getFieldsForCollectionAlphabetical(state.relations[0].collection).map((field: Field) => ({
					text: field.field,
					value: field.field,
					disabled:
						!field.schema || field.schema?.is_primary_key || field.type !== currentCollectionPrimaryKey.value.type,
				}));
			});

			const collectionMany = computed({
				get() {
					return state.relations[0].collection!;
				},
				set(collection: string) {
					state.relations[0].collection = collection;
					state.relations[0].field = '';
				},
			});

			return { availableCollections, systemCollections, fields, currentCollectionPrimaryKey, collectionMany };
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					if (!state?.relations?.[0]?.collection || !state?.relations?.[0]?.field) return false;

					if (relatedFieldExists.value === true) {
						return (
							state.updateFields.find((updateField: any) => updateField.field === state.relations[0].field)?.meta
								?.interface === 'select-dropdown-m2o' ||
							fieldsStore.getField(state.relations[0].collection, state.relations[0].field)?.meta?.interface ===
								'select-dropdown-m2o'
						);
					} else {
						return (
							state.newFields.find((newField: any) => newField.$type === 'manyRelated')?.meta?.interface ===
							'select-dropdown-m2o'
						);
					}
				},
				set(enabled: boolean) {
					if (!state?.relations?.[0]?.field) return;

					if (relatedFieldExists.value === true) {
						if (enabled === true) {
							state.updateFields = [
								{
									collection: state.relations[0].related_collection!,
									field: state.relations[0].field,
									meta: {
										interface: 'select-dropdown-m2o',
										special: ['m2o'],
									},
								},
							];
						} else {
							state.updateFields = [
								{
									collection: state.relations[0].related_collection!,
									field: state.relations[0].field,
									meta: {
										interface: null,
										special: null,
									},
								},
							];
						}
					} else {
						const newFieldCreated = !!state.newFields.find((newField: any) => newField.$type === 'manyRelated');

						if (newFieldCreated === false) {
							state.newFields = [
								...state.newFields,
								{
									$type: 'manyRelated',
									collection: state.relations[0].related_collection!,
									field: state.relations[0].field,
									meta: {
										interface: 'select-dropdown-m2o',
										special: ['m2o'],
									},
								},
							];
						} else {
							state.newFields = state.newFields.map((newField: any) => {
								if (newField.$type === 'manyRelated') {
									if (!newField.meta) newField.meta = {};
									if (enabled === true) {
										newField.meta.interface = 'select-dropdown-m2o';
										newField.meta.special = ['m2o'];
									} else {
										newField.meta.interface = null;
										newField.meta.special = null;
									}
								}

								return newField;
							});
						}
					}
				},
			});

			const correspondingLabel = computed(() => {
				if (state.relations[0].collection) {
					return t('add_m2o_to_collection', { collection: state.relations[0].collection });
				}

				return t('add_field_related');
			});

			return { hasCorresponding, correspondingLabel };
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

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		bottom: 17px;
		left: 50%;
		transform: translateX(-50%);
	}
}

.v-input.matches {
	--v-input-color: var(--primary);
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
		bottom: 17px;
		left: 50%;
		transform: translateX(-50%);
	}
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

.sort-field {
	--v-input-font-family: var(--family-monospace);

	.v-divider {
		margin-top: 48px;
		margin-bottom: 24px;
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
