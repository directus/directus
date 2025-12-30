<script setup lang="ts">
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';
import VCheckbox from '@/components/v-checkbox.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();
const collectionsStore = useCollectionsStore();
const relationsStore = useRelationsStore();
const fieldsStore = useFieldsStore();

const { collection, editing, generationInfo } = storeToRefs(fieldDetailStore);

const autoGenerateJunctionRelation = syncFieldDetailStoreProperty('autoGenerateJunctionRelation');
const junctionCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
const junctionFieldCurrent = syncFieldDetailStoreProperty('relations.o2m.field');
const junctionFieldRelated = syncFieldDetailStoreProperty('relations.m2o.field');
const oneCollectionField = syncFieldDetailStoreProperty('relations.m2o.meta.one_collection_field');
const oneAllowedCollections = syncFieldDetailStoreProperty('relations.m2o.meta.one_allowed_collections', []);
const sortField = syncFieldDetailStoreProperty('relations.o2m.meta.sort_field');
const onDelete = syncFieldDetailStoreProperty('relations.o2m.schema.on_delete');
const onDeselect = syncFieldDetailStoreProperty('relations.o2m.meta.one_deselect_action');

const isExisting = computed(() => editing.value !== '+');
const currentPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(collection.value!)?.field);

const availableCollections = computed(() => {
	return [
		...collectionsStore.databaseCollections.filter((collection) => collection.meta),
		{
			divider: true,
		},
		{
			collection: t('system'),
			selectable: false,
			children: collectionsStore.crudSafeSystemCollections,
		},
	];
});

const unsortableJunctionFields = computed(() => {
	const fields = ['item', 'collection'];

	if (junctionCollection.value) {
		const relations = relationsStore.getRelationsForCollection(junctionCollection.value);
		fields.push(...relations.map((field) => field.field));
	}

	return fields;
});
</script>

<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<VInput disabled :model-value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('junction_collection') }}</div>
				<RelatedCollectionSelect v-model="junctionCollection" :disabled="autoGenerateJunctionRelation || isExisting" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('related_collections') }}</div>

				<VSelect
					v-model="oneAllowedCollections"
					:placeholder="$t('collection') + '...'"
					:items="availableCollections"
					item-value="collection"
					item-text="collection"
					item-label-font-family="var(--theme--fonts--monospace--font-family)"
					item-disabled="meta.singleton"
					multiple
					:multiple-preview-threshold="0"
				/>
			</div>

			<div class="primary-key">
				<div class="field-wrapper">
					<VInput disabled :model-value="currentPrimaryKey" />
					<VIcon class="arrow" name="arrow_forward" />
				</div>
			</div>

			<RelatedFieldSelect
				v-model="junctionFieldCurrent"
				:collection="junctionCollection"
				:disabled="autoGenerateJunctionRelation || isExisting"
			/>

			<div class="related-collections-preview">{{ (oneAllowedCollections ?? []).join(', ') }}</div>

			<div class="spacer" />

			<div class="junction-field-related">
				<div class="field-wrapper">
					<RelatedFieldSelect
						v-model="oneCollectionField"
						:collection="junctionCollection"
						:placeholder="$t('collection_key') + '...'"
						:disabled="autoGenerateJunctionRelation || isExisting"
					/>
					<VIcon class="arrow" name="arrow_back" />
				</div>
			</div>

			<div class="spacer" />

			<div class="field-wrapper">
				<RelatedFieldSelect v-model="junctionFieldRelated" :disabled="autoGenerateJunctionRelation || isExisting" />
				<VIcon class="arrow" name="arrow_back" />
			</div>

			<VInput disabled :model-value="$t('primary_key')" />

			<div class="spacer" />
			<VCheckbox v-if="!isExisting" v-model="autoGenerateJunctionRelation" block :label="$t('auto_fill')" />
		</div>

		<div class="sort-field">
			<VDivider large :inline-title="false">{{ $t('sort_field') }}</VDivider>
			<RelatedFieldSelect
				v-model="sortField"
				:type-allow-list="['integer', 'bigInteger', 'float', 'decimal']"
				:disabled-fields="unsortableJunctionFields"
				:collection="junctionCollection"
				:placeholder="$t('add_sort_field')"
				nullable
			/>
		</div>

		<div class="relational-triggers">
			<VDivider class="field full" large :inline-title="false">{{ $t('relational_triggers') }}</VDivider>

			<div class="field">
				<div class="type-label">
					{{
						$t('referential_action_field_label_m2o', {
							collection: collection || 'related',
						})
					}}
				</div>
				<VSelect
					v-model="onDelete"
					:disabled="collection === junctionCollection"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: $t('referential_action_set_null', { field: junctionFieldRelated }),
							value: 'SET NULL',
						},
						{
							text: $t('referential_action_set_default', { field: junctionFieldRelated }),
							value: 'SET DEFAULT',
						},
						{
							text: $t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldRelated,
							}),
							value: 'CASCADE',
						},
						{
							text: $t('referential_action_no_action'),
							value: 'NO ACTION',
						},
					]"
				/>
			</div>

			<div class="field">
				<div class="type-label">
					{{
						$t('referential_action_field_label_o2m', {
							collection: junctionCollection || 'related',
						})
					}}
				</div>
				<VSelect
					v-model="onDeselect"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: $t('referential_action_set_null', { field: junctionFieldRelated }),
							value: 'nullify',
						},
						{
							text: $t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldRelated,
							}),
							value: 'delete',
						},
					]"
				/>
			</div>
		</div>

		<VNotice v-if="generationInfo.length > 0" class="generated-data" type="warning">
			<span>
				{{ $t('new_data_alert') }}
				<ul>
					<li v-for="(data, index) in generationInfo" :key="index">
						<span class="field-name">{{ data.name }}</span>
					</li>
				</ul>
			</span>
		</VNotice>
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

	.field-wrapper {
		display: flex;
		flex: 1;
		position: relative;

		.v-icon.arrow {
			--v-icon-color: var(--theme--primary);
			position: absolute;
			pointer-events: none;

			inset-block-start: 50%;
			transform: translateY(-50%);
			inset-inline-end: -26px; // moves it to the center of the column-gap ( icon-width + (gap - icon-width) / 2 )
		}
	}

	.junction-field-related {
		display: flex;
		align-items: flex-end;
	}

	.primary-key {
		display: flex;
		align-items: flex-start;
	}
}

.v-input.matches {
	--v-input-color: var(--theme--primary);
}

.type-label {
	margin-block-end: 8px;
}

.v-list {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}

.v-notice {
	margin-block-end: 36px;
}

.generated-data {
	margin-block-start: 36px;

	ul {
		padding-block-start: 4px;
		padding-inline-start: 24px;
	}

	.field-name {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}

.related-collections-preview {
	grid-row: 2 / span 2;
	grid-column: 3;
	padding: var(--theme--form--field--input--padding);
	overflow: auto;
	color: var(--theme--foreground-subdued);
	font-family: var(--theme--fonts--monospace--font-family);
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}

.one-collection-field {
	align-self: flex-end;
}

.sort-field {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);

	.v-divider {
		margin-block: 48px 24px;
	}
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
