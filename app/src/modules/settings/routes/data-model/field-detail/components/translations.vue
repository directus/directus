<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ t('this_collection') }}</div>
				<v-input disabled :value="relations[0].related_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('translations_collection') }}</div>
				<v-input
					:class="{ matches: junctionCollectionExists }"
					v-model="junctionCollection"
					:nullable="false"
					:placeholder="t('collection') + '...'"
					:disabled="autoFill || isExisting"
					db-safe
				>
					<template #append>
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
									@click="relations[0].collection = collection.collection"
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
										@click="relations[0].collection = collection.collection"
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
				</v-input>
			</div>
			<div class="field">
				<div class="type-label">{{ t('languages_collection') }}</div>
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
							<template #activator="{ toggle }">
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
				<template #append v-if="junctionCollectionExists">
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
				<template #append v-if="junctionCollectionExists">
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
			</v-input>
			<v-input disabled v-model="relatedPrimaryKeyField" :placeholder="t('primary_key') + '...'" />
			<div class="spacer" />
			<v-checkbox :disabled="isExisting" block v-model="autoFill" :label="t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_backward" />
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
								collection: relatedCollectionName,
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
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { orderBy } from 'lodash';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { Field } from '@/types';
import formatTitle from '@directus/format-title';

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

			return fieldsStore.getFieldsForCollection(junctionCollection.value).map((field: Field) => ({
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
			currentPrimaryKeyField,
			relatedPrimaryKeyField,
			junctionCollectionName,
			junctionM2OFieldName,
			currentCollectionName,
			junctionRelatedM2OFieldName,
			relatedCollectionName,
		};

		function junctionFieldExists(fieldKey: string) {
			if (!junctionCollection.value) return false;
			return !!fieldsStore.getField(junctionCollection.value, fieldKey);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
@import '@/styles/mixins/no-wrap';

.grid {
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

	position: relative;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px 28px;
	margin-top: 48px;

	.v-input.matches {
		--v-input-color: var(--primary);
	}

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		&:first-of-type {
			bottom: 161px;
			left: 32.5%;
		}

		&:last-of-type {
			bottom: 89px;
			left: 67.4%;
		}
	}
}

.type-label {
	margin-bottom: 8px;

	@include no-wrap;
}

.v-divider {
	margin: 48px 0;
}

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
}

.v-notice {
	margin-bottom: 36px;
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
