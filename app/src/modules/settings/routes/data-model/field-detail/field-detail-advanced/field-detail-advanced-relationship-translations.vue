<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ t('this_collection') }}</div>
				<v-input disabled :model-value="collection" />
			</div>

			<div class="field">
				<div class="type-label">{{ t('translations_collection') }}</div>
				<related-collection-select
					v-model="junctionCollection"
					:disabled="autoGenerateJunctionRelation || isExisting"
				/>
			</div>
			<div class="field">
				<div class="type-label">{{ t('languages_collection') }}</div>
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
			<v-input v-model="relatedPrimaryKey" disabled :placeholder="t('primary_key') + '...'" />
			<div class="spacer" />
			<v-checkbox v-model="autoGenerateJunctionRelation" :disabled="isExisting" block :label="t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_backward" />
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ t('relational_triggers') }}</v-divider>

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
					:placeholder="t('choose_action') + '...'"
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
					:placeholder="t('choose_action') + '...'"
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
					:placeholder="t('choose_action') + '...'"
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { useFieldsStore } from '@/stores/fields';

export default defineComponent({
	components: { RelatedCollectionSelect, RelatedFieldSelect },
	setup() {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();
		const fieldsStore = useFieldsStore();

		const { field, collection, editing, generationInfo } = storeToRefs(fieldDetailStore);

		const sortField = syncFieldDetailStoreProperty('relations.o2m.meta.sort_field');
		const junctionCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
		const junctionFieldCurrent = syncFieldDetailStoreProperty('relations.o2m.field');
		const junctionFieldRelated = syncFieldDetailStoreProperty('relations.m2o.field');
		const relatedCollection = syncFieldDetailStoreProperty('relations.m2o.related_collection');
		const autoGenerateJunctionRelation = syncFieldDetailStoreProperty('autoGenerateJunctionRelation');
		const onDeleteCurrent = syncFieldDetailStoreProperty('relations.o2m.schema.on_delete');
		const onDeleteRelated = syncFieldDetailStoreProperty('relations.m2o.schema.on_delete');
		const deselectAction = syncFieldDetailStoreProperty('relations.o2m.meta.one_deselect_action');
		const correspondingField = syncFieldDetailStoreProperty('fields.corresponding');

		const type = computed(() => field.value.type);
		const isExisting = computed(() => editing.value !== '+');

		const currentPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(collection.value!)?.field);

		const relatedPrimaryKey = computed(
			() => fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value)?.field ?? 'id'
		);

		const hasCorresponding = computed({
			get() {
				return !!correspondingField.value;
			},
			set(enabled: boolean) {
				if (enabled) {
					correspondingField.value = {
						field: collection.value,
						collection: relatedCollection.value,
						type: 'alias',
						meta: {
							special: ['m2m'],
							interface: 'list-m2m',
						},
					};
				} else {
					correspondingField.value = null;
				}
			},
		});

		const correspondingLabel = computed(() => {
			if (junctionCollection.value) {
				return t('add_m2m_to_collection', { collection: relatedCollection.value });
			}

			return t('add_field_related');
		});

		const correspondingFieldKey = computed({
			get() {
				return correspondingField.value?.field;
			},
			set(key: string | undefined) {
				if (!hasCorresponding.value) {
					hasCorresponding.value = true;
				}

				correspondingField.value!.field = key;
			},
		});

		return {
			t,
			autoGenerateJunctionRelation,
			collection,
			type,
			isExisting,
			junctionCollection,
			junctionFieldCurrent,
			relatedCollection,
			sortField,
			currentPrimaryKey,
			junctionFieldRelated,
			relatedPrimaryKey,
			onDeleteCurrent,
			onDeleteRelated,
			deselectAction,
			hasCorresponding,
			correspondingLabel,
			correspondingFieldKey,
			generationInfo,
		};
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
