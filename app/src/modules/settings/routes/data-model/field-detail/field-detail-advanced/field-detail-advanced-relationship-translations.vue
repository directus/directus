<script setup lang="ts">
import { computed } from 'vue';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { useFieldsStore } from '@/stores/fields';


const fieldDetailStore = useFieldDetailStore();
const fieldsStore = useFieldsStore();

const { field, collection, editing } = storeToRefs(fieldDetailStore);

const junctionCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
const junctionFieldCurrent = syncFieldDetailStoreProperty('relations.o2m.field');
const junctionFieldRelated = syncFieldDetailStoreProperty('relations.m2o.field');
const relatedCollection = syncFieldDetailStoreProperty('relations.m2o.related_collection');
const autoGenerateJunctionRelation = syncFieldDetailStoreProperty('autoGenerateJunctionRelation');
const onDeleteCurrent = syncFieldDetailStoreProperty('relations.o2m.schema.on_delete');
const onDeleteRelated = syncFieldDetailStoreProperty('relations.m2o.schema.on_delete');
const deselectAction = syncFieldDetailStoreProperty('relations.o2m.meta.one_deselect_action');

const type = computed(() => field.value.type);
const isExisting = computed(() => editing.value !== '+');

const currentPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(collection.value!)?.field);

const relatedPrimaryKey = computed(
	() => fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value)?.field ?? 'id',
);
</script>

<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $$t('this_collection') }}</div>
				<v-input disabled :model-value="collection" />
			</div>

			<div class="field">
				<div class="type-label">{{ $$t('translations_collection') }}</div>
				<related-collection-select
					v-model="junctionCollection"
					:disabled="autoGenerateJunctionRelation || isExisting"
				/>
			</div>
			<div class="field">
				<div class="type-label">{{ $$t('languages_collection') }}</div>
				<related-collection-select v-model="relatedCollection" :disabled="type === 'files' || isExisting" />
			</div>
			<v-input disabled :model-value="currentPrimaryKey" />
			<related-field-select
				v-model="junctionFieldCurrent"
				:collection="junctionCollection"
				:disabled="autoGenerateJunctionRelation || isExisting"
			/>
			<div class="spacer" />
			<div class="spacer" />
			<related-field-select
				v-model="junctionFieldRelated"
				:collection="junctionCollection"
				:disabled="autoGenerateJunctionRelation || isExisting"
			/>
			<v-input v-model="relatedPrimaryKey" disabled :placeholder="$t('primary_key') + '...'" />
			<div class="spacer" />
			<v-checkbox v-model="autoGenerateJunctionRelation" :disabled="isExisting" block :label="$t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_back" />
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ $$t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_o2m', {
							collection: junctionCollection || '',
						})
					}}
				</div>
				<v-select
					v-model="deselectAction"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', {
								collection: junctionCollection,
								field: junctionFieldCurrent,
							}),
							value: 'nullify',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldCurrent,
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
							collection: collection || 'related',
						})
					}}
				</div>
				<v-select
					v-model="onDeleteCurrent"
					:disabled="junctionCollection === collection"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: junctionFieldCurrent }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: junctionFieldCurrent }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldCurrent,
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
							collection: relatedCollection || 'related',
						})
					}}
				</div>
				<v-select
					v-model="onDeleteRelated"
					:disabled="junctionCollection === relatedCollection"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: junctionFieldRelated }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: junctionFieldRelated }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldRelated,
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

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
	--v-input-font-family: var(--theme--fonts--monospace--font-family);

	position: relative;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px 28px;
	margin-block-start: 48px;

	.v-input.matches {
		--v-input-color: var(--theme--primary);
	}

	.v-icon.arrow {
		--v-icon-color: var(--theme--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		html[dir='rtl'] & {
			transform: translateX(50%) scaleX(-1);
		}

		&:first-of-type {
			inset-block-end: 161px;
			inset-inline-start: 32.5%;
		}

		&:last-of-type {
			inset-block-end: 89px;
			inset-inline-start: 67.4%;
		}
	}
}

.type-label {
	margin-block-end: 8px;

	@include mixins.no-wrap;
}

.v-divider {
	margin: 48px 0;
}

.v-list {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}

.v-notice {
	margin-block-end: 36px;
}

.relational-triggers {
	--theme--form--column-gap: 12px;
	--theme--form--row-gap: 24px;

	@include mixins.form-grid;

	.v-divider {
		margin-block: 48px 0;
	}
}
</style>
