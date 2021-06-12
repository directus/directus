<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ t('this_collection') }}</div>
				<v-input disabled :model-value="relations[0].related_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('junction_collection') }}</div>
				<v-input
					:class="{ matches: junctionCollectionExists }"
					v-model="junctionCollection"
					:nullable="false"
					:placeholder="t('collection') + '...'"
					:disabled="autoFill || isExisting"
					db-safe
				>
					<template #append v-if="!isExisting">
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon
									name="list_alt"
									clickable
									@click="toggle"
									v-tooltip="t('select_existing')"
									:disabled="autoFill || isExisting"
								/>
							</template>

							<v-list class="monospace">
								<v-list-item
									v-for="collection in availableCollections"
									:key="collection.collection"
									:active="relations[0].collection === collection.collection"
									@click="junctionCollection = collection.collection"
									clickable
								>
									<v-list-item-content>
										{{ collection.collection }}
									</v-list-item-content>
								</v-list-item>

								<v-divider />

								<v-list-group>
									<template #activator>{{ t('system') }}</template>
									<v-list-item
										v-for="collection in systemCollections"
										:key="collection.collection"
										:active="relations[0].collection === collection.collection"
										@click="junctionCollection = collection.collection"
										clickable
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
						<v-text-overflow :text="junctionCollection" />
					</template>
				</v-input>
			</div>
			<div class="field">
				<div class="type-label">{{ t('related_collection') }}</div>
				<v-input
					:autofocus="autoFill"
					:class="{ matches: relatedCollectionExists }"
					v-model="relations[1].related_collection"
					:nullable="false"
					:placeholder="t('collection') + '...'"
					:disabled="type === 'files' || isExisting"
					db-safe
				>
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }" v-if="!isExisting">
								<v-icon
									name="list_alt"
									clickable
									@click="toggle"
									v-tooltip="t('select_existing')"
									:disabled="type === 'files' || isExisting"
								/>
							</template>

							<v-list class="monospace">
								<v-list-item
									v-for="collection in availableCollections"
									:key="collection.collection"
									:active="relations[1].related_collection === collection.collection"
									@click="relations[1].related_collection = collection.collection"
									clickable
								>
									<v-list-item-content>
										{{ collection.collection }}
									</v-list-item-content>
								</v-list-item>

								<v-divider />

								<v-list-group>
									<template #activator>{{ t('system') }}</template>
									<v-list-item
										v-for="collection in systemCollections"
										:key="collection.collection"
										:active="relations[1].related_collection === collection.collection"
										@click="relations[1].related_collection = collection.collection"
										clickable
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
						<v-text-overflow :text="relations[1].related_collection" />
					</template>
				</v-input>
			</div>
			<v-input disabled :model-value="currentPrimaryKeyField" />
			<v-input
				:class="{ matches: junctionFieldExists(relations[0].field) }"
				v-model="relations[0].field"
				:nullable="false"
				:placeholder="t('foreign_key') + '...'"
				:disabled="autoFill || isExisting"
				db-safe
			>
				<template #append v-if="junctionCollectionExists && !isExisting">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon
								name="list_alt"
								clickable
								@click="toggle"
								v-tooltip="t('select_existing')"
								:disabled="autoFill || isExisting"
							/>
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].field === item.value"
								:disabled="item.disabled"
								@click="relations[0].field = item.value"
								clickable
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>

				<template #input v-if="isExisting">
					<v-text-overflow :text="relations[0].field" />
				</template>
			</v-input>
			<div class="spacer" />
			<div class="spacer" />
			<v-input
				:class="{ matches: junctionFieldExists(relations[1].field) }"
				v-model="relations[1].field"
				:nullable="false"
				:placeholder="t('foreign_key') + '...'"
				:disabled="autoFill || isExisting"
				db-safe
			>
				<template #append v-if="junctionCollectionExists && !isExisting">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon
								name="list_alt"
								clickable
								@click="toggle"
								v-tooltip="t('select_existing')"
								:disabled="autoFill || isExisting"
							/>
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[1].field === item.value"
								:disabled="item.disabled"
								@click="relations[1].field = item.value"
								clickable
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>

				<template #input v-if="isExisting">
					<v-text-overflow :text="relations[1].field" />
				</template>
			</v-input>
			<v-input disabled v-model="relatedPrimaryKeyField" :placeholder="t('primary_key') + '...'" />
			<div class="spacer" />
			<v-checkbox v-if="!isExisting" block v-model="autoFill" :label="t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_backward" />
		</div>

		<v-divider large :inline-title="false" v-if="!isExisting">{{ t('corresponding_field') }}</v-divider>

		<div class="corresponding" v-if="!isExisting">
			<div class="field">
				<div class="type-label">{{ t('create_field') }}</div>
				<v-checkbox block :label="correspondingLabel" v-model="hasCorresponding" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('field_name') }}</div>
				<v-input
					:disabled="hasCorresponding === false"
					v-model="correspondingField"
					:placeholder="t('field_name') + '...'"
					db-safe
				/>
			</div>
			<v-icon name="arrow_forward" class="arrow" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ t('sort_field') }}</v-divider>

			<v-input
				:class="{ matches: junctionFieldExists(relations[0].meta.sort_field) }"
				v-model="relations[0].meta.sort_field"
				:placeholder="t('add_sort_field') + '...'"
				db-safe
			>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" clickable @click="toggle" v-tooltip="t('select_existing')" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].meta.sort_field === item.value"
								:disabled="item.disabled"
								@click="relations[0].meta.sort_field = item.value"
								clickable
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

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_o2m', {
							collection: junctionCollectionName || '',
						})
					}}
				</div>
				<v-select
					v-model="relations[0].meta.one_deselect_action"
					:placeholder="t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', {
								collection: junctionCollectionName,
								field: junctionM2OFieldName,
							}),
							value: 'nullify',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollectionName,
								field: junctionM2OFieldName,
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
							text: t('referential_action_set_null', { field: junctionM2OFieldName }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: junctionM2OFieldName }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollectionName,
								field: junctionM2OFieldName,
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

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_m2o', {
							collection: relatedCollectionName || 'related',
						})
					}}
				</div>
				<v-select
					v-model="relations[1].schema.on_delete"
					:disabled="relations[1].collection === relations[1].related_collection"
					:placeholder="t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: junctionRelatedM2OFieldName }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: junctionRelatedM2OFieldName }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollectionName,
								field: junctionRelatedM2OFieldName,
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

		<v-notice class="generated-data" v-if="generationInfo.length > 0" type="warning">
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
import { orderBy } from 'lodash';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { Field } from '@/types';

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
	setup() {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const autoFill = computed({
			get() {
				return state.autoFillJunctionRelation;
			},
			set(newAuto: boolean) {
				state.autoFillJunctionRelation = newAuto;
			},
		});

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

		const junctionCollection = computed({
			get() {
				return state.relations[0].collection;
			},
			set(collection: string | undefined) {
				state.relations[0].collection = collection;
				state.relations[1].collection = collection;
			},
		});

		const junctionCollectionExists = computed(() => {
			return junctionCollection.value && collectionsStore.getCollection(junctionCollection.value) !== null;
		});

		const relatedCollectionExists = computed(() => {
			return (
				state.relations[1].related_collection &&
				collectionsStore.getCollection(state.relations[1].related_collection) !== null
			);
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore.getFieldsForCollectionAlphabetical(junctionCollection.value).map((field: Field) => ({
				text: field.field,
				value: field.field,
				disabled:
					state.relations[0].field === field.field ||
					field.schema?.is_primary_key ||
					state.relations[1].field === field.field,
			}));
		});

		const currentPrimaryKeyField = computed(
			() => fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].related_collection).field
		);

		const relatedPrimaryKeyField = computed(() => {
			if (!state.relations[1].related_collection) return '';

			if (relatedCollectionExists.value) {
				return fieldsStore.getPrimaryKeyFieldForCollection(state.relations[1].related_collection).field;
			}

			return 'id';
		});

		const currentCollectionName = computed(() => {
			if (!state.relations[0].related_collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].related_collection)?.name ||
				formatTitle(state.relations[0].related_collection)
			);
		});

		const junctionCollectionName = computed(() => {
			if (!state.relations[0].collection) return null;
			return (
				collectionsStore.getCollection(state.relations[0].collection)?.name ||
				formatTitle(state.relations[0].collection)
			);
		});

		const junctionM2OFieldName = computed(() => {
			if (!state.relations[0].collection || !state.relations[0].field) return null;
			return (
				fieldsStore.getField(state.relations[0].collection, state.relations[0].field)?.name ||
				formatTitle(state.relations[0].field)
			);
		});

		const junctionRelatedM2OFieldName = computed(() => {
			if (!state.relations[1].collection || !state.relations[1].field) return null;
			return (
				fieldsStore.getField(state.relations[1].collection, state.relations[1].field)?.name ||
				formatTitle(state.relations[1].field)
			);
		});

		const relatedCollectionName = computed(() => {
			if (!state.relations[1].related_collection) return null;
			return (
				collectionsStore.getCollection(state.relations[1].related_collection)?.name ||
				formatTitle(state.relations[1].related_collection)
			);
		});

		const { hasCorresponding, correspondingField, correspondingLabel } = useCorresponding();

		return {
			t,
			relations: state.relations,
			autoFill,
			availableCollections,
			systemCollections,
			junctionCollection,
			junctionFields,
			junctionCollectionExists,
			relatedCollectionExists,
			junctionFieldExists,
			hasCorresponding,
			correspondingField,
			correspondingLabel,
			generationInfo,
			currentPrimaryKeyField,
			relatedPrimaryKeyField,
			junctionCollectionName,
			junctionM2OFieldName,
			currentCollectionName,
			junctionRelatedM2OFieldName,
			relatedCollectionName,
		};

		function junctionFieldExists(fieldKey: string) {
			if (!junctionCollection.value || !fieldKey) return false;
			return !!fieldsStore.getField(junctionCollection.value, fieldKey);
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					return !!state.newFields.find((field: any) => field.$type === 'corresponding');
				},
				set(enabled: boolean) {
					if (enabled === true && !!state.newFields.find((field: any) => field.$type === 'corresponding') === false) {
						state.newFields = [
							...state.newFields,
							{
								$type: 'corresponding',
								field: state.relations[0].related_collection!,
								collection: state.relations[1].related_collection!,
								type: 'alias',
								meta: {
									special: ['m2m'],
									interface: 'list-m2m',
								},
							},
						];

						state.relations[1].meta = {
							...(state.relations[1].meta || {}),
							one_field: state.relations[0].related_collection,
						};
					} else {
						state.newFields = state.newFields.filter((field: any) => field.$type !== 'corresponding');
						state.relations[1].meta = {
							...(state.relations[1].meta || {}),
							one_field: null,
						};
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
								field: field,
							};
						}

						return newField;
					});

					state.relations[1].meta = {
						...(state.relations[1].meta || {}),
						one_field: field,
					};
				},
			});

			const correspondingLabel = computed(() => {
				if (state.relations[0].related_collection) {
					return t('add_m2m_to_collection', { collection: state.relations[1].related_collection });
				}

				return t('add_field_related');
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
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px 28px;
	margin-top: 48px;

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		&:first-of-type {
			top: 117px;
			left: 32.5%;
		}

		&:last-of-type {
			top: 190px;
			left: 67.4%;
		}
	}
}

.v-input.matches {
	--v-input-color: var(--primary);
}

.type-label {
	margin-bottom: 8px;
}

.v-divider {
	margin: 48px 0 24px;
}

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
}

.corresponding {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;

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
