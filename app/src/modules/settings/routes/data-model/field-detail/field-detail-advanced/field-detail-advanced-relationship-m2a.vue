<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ t('this_collection') }}</div>
				<v-input disabled :model-value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ t('junction_collection') }}</div>
				<related-collection-select
					v-model="junctionCollection"
					:disabled="autoGenerateJunctionRelation || isExisting"
				/>
			</div>

			<div class="field">
				<div class="type-label">{{ t('related_collections') }}</div>

				<v-select
					v-model="oneAllowedCollections"
					:placeholder="t('collection') + '...'"
					:items="availableCollections"
					item-value="collection"
					item-text="name"
					item-disabled="meta.singleton"
					multiple
					:is-menu-same-width="false"
					:multiple-preview-threshold="0"
				/>
			</div>

			<v-input disabled :model-value="currentPrimaryKey" />

			<related-field-select
				v-model="junctionFieldCurrent"
				:collection="junctionCollection"
				:disabled="autoGenerateJunctionRelation || isExisting"
			/>

			<div class="related-collections-preview">{{ (oneAllowedCollections ?? []).join(', ') }}</div>

			<div class="spacer" />

			<related-field-select
				v-model="oneCollectionField"
				:collection="junctionCollection"
				:placeholder="t('collection_key') + '...'"
				:disabled="autoGenerateJunctionRelation || isExisting"
			/>

			<div class="spacer" />

			<related-field-select v-model="junctionFieldRelated" :disabled="autoGenerateJunctionRelation || isExisting" />

			<v-input disabled :model-value="t('primary_key')" />

			<div class="spacer" />
			<v-checkbox v-if="!isExisting" v-model="autoGenerateJunctionRelation" block :label="t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_back" />
			<v-icon class="arrow" name="arrow_back" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ t('sort_field') }}</v-divider>
			<related-field-select
				v-model="sortField"
				:type-allow-list="['integer', 'bigInteger', 'float', 'decimal']"
				:disabled-fields="unsortableJunctionFields"
				:collection="junctionCollection"
				:placeholder="t('add_sort_field')"
				:nullable="true"
			/>
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_m2o', {
							collection: collection || 'related',
						})
					}}
				</div>
				<v-select
					v-model="onDelete"
					:disabled="collection === junctionCollection"
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

			<div class="field">
				<div class="type-label">
					{{
						t('referential_action_field_label_o2m', {
							collection: junctionCollection || 'related',
						})
					}}
				</div>
				<v-select
					v-model="onDeselect"
					:placeholder="t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: junctionFieldRelated }),
							value: 'nullify',
						},
						{
							text: t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldRelated,
							}),
							value: 'delete',
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
					</li>
				</ul>
			</span>
		</v-notice>
	</div>
</template>

<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { orderBy } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

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
	return orderBy(
		[
			...collectionsStore.databaseCollections,
			{
				divider: true,
			},
			{
				name: t('system'),
				selectable: false,
				children: collectionsStore.crudSafeSystemCollections,
			},
		],
		['collection'],
		['asc']
	);
});

const unsortableJunctionFields = computed(() => {
	let fields = ['item', 'collection'];

	if (junctionCollection.value) {
		const relations = relationsStore.getRelationsForCollection(junctionCollection.value);
		fields.push(...relations.map((field) => field.field));
	}

	return fields;
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

		&:nth-of-type(2) {
			top: 190px;
			left: 67.4%;
		}

		&:last-of-type {
			top: 261px;
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

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
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

.related-collections-preview {
	grid-row: 2 / span 2;
	grid-column: 3;
	padding: var(--input-padding);
	overflow: auto;
	color: var(--foreground-subdued);
	font-family: var(--family-monospace);
	background-color: var(--background-subdued);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.one-collection-field {
	align-self: flex-end;
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
