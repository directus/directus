<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();
const relationsStore = useRelationsStore();
const fieldsStore = useFieldsStore();

const { collection, editing, generationInfo } = storeToRefs(fieldDetailStore);

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
const correspondingFieldKey = syncFieldDetailStoreProperty('fields.corresponding.field');

const isExisting = computed(() => editing.value !== '+');

const currentPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(collection.value!)?.field);

const relatedPrimaryKey = computed(
	() => fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value)?.field ?? 'id',
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

const unsortableJunctionFields = computed(() => {
	const fields = [];

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
				<v-input disabled :model-value="collection" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('junction_collection') }}</div>

				<related-collection-select
					v-model="junctionCollection"
					:disabled="autoGenerateJunctionRelation || isExisting"
				/>
			</div>

			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<related-collection-select v-model="relatedCollection" :disabled="isExisting" />
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

			<v-checkbox v-if="!isExisting" v-model="autoGenerateJunctionRelation" block :label="$t('auto_fill')" />

			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_back" />
		</div>

		<v-divider v-if="!isExisting" large :inline-title="false">{{ $t('corresponding_field') }}</v-divider>

		<div v-if="!isExisting" class="corresponding">
			<div class="field">
				<div class="type-label">{{ $t('create_field') }}</div>
				<v-checkbox v-model="hasCorresponding" block :label="correspondingLabel" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('field_name') }}</div>
				<v-input
					v-model="correspondingFieldKey"
					:disabled="hasCorresponding === false"
					:placeholder="$t('field_name') + '...'"
					db-safe
				/>
			</div>
			<v-icon name="arrow_forward" class="arrow" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ $t('sort_field') }}</v-divider>
			<related-field-select
				v-model="sortField"
				:collection="junctionCollection"
				:type-allow-list="['integer', 'bigInteger', 'float', 'decimal']"
				:disabled-fields="unsortableJunctionFields"
				:placeholder="$t('add_sort_field') + '...'"
				nullable
			/>
		</div>

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ $t('relational_triggers') }}</v-divider>

			<div class="field">
				<div class="type-label">
					{{
						$t('referential_action_field_label_o2m', {
							collection: junctionCollection || '',
						})
					}}
				</div>
				<v-select
					v-model="deselectAction"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: $t('referential_action_set_null', {
								collection: junctionCollection,
								field: junctionFieldCurrent,
							}),
							value: 'nullify',
						},
						{
							text: $t('referential_action_cascade', {
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
						$t('referential_action_field_label_m2o', {
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
							text: $t('referential_action_set_null', { field: junctionFieldCurrent }),
							value: 'SET NULL',
						},
						{
							text: $t('referential_action_set_default', { field: junctionFieldCurrent }),
							value: 'SET DEFAULT',
						},
						{
							text: $t('referential_action_cascade', {
								collection: junctionCollection,
								field: junctionFieldCurrent,
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
						$t('referential_action_field_label_m2o', {
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
		</div>

		<v-notice v-if="generationInfo.length > 0" class="generated-data" type="warning">
			<span>
				{{ $t('new_data_alert') }}

				<ul>
					<li v-for="(data, index) in generationInfo" :key="index">
						<span class="field-name">{{ data.name }}</span>
					</li>
				</ul>
			</span>
		</v-notice>
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

	.v-icon.arrow {
		--v-icon-color: var(--theme--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		html[dir='rtl'] & {
			transform: translateX(50%) scaleX(-1);
		}

		&:first-of-type {
			inset-block-start: 117px;
			inset-inline-start: 32.5%;
		}

		&:last-of-type {
			inset-block-start: 190px;
			inset-inline-start: 67.4%;
		}
	}
}

.v-input.matches {
	--v-input-color: var(--theme--primary);
}

.type-label {
	margin-block-end: 8px;
}

.v-divider {
	margin: 48px 0 24px;
}

.v-list {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}

.corresponding {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;

	.arrow {
		--v-icon-color: var(--theme--primary);

		position: absolute;
		inset-block-end: 17px;
		inset-inline-start: 50%;
		transform: translateX(-50%);

		html[dir='rtl'] & {
			transform: translateX(50%) scaleX(-1);
		}
	}
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
