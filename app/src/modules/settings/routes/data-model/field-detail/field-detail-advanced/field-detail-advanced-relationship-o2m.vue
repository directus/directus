<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';


const fieldDetailStore = useFieldDetailStore();
const relationsStore = useRelationsStore();
const fieldsStore = useFieldsStore();

const relatedCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
const relatedField = syncFieldDetailStoreProperty('relations.o2m.field');
const sortField = syncFieldDetailStoreProperty('relations.o2m.meta.sort_field');
const onDelete = syncFieldDetailStoreProperty('relations.o2m.schema.on_delete');
const onDeselect = syncFieldDetailStoreProperty('relations.o2m.meta.one_deselect_action');

const { collection, editing, generationInfo } = storeToRefs(fieldDetailStore);

const isExisting = computed(() => editing.value !== '+');
const currentPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(collection.value!)?.field);

const unsortableJunctionFields = computed(() => {
	const fields = [];

	if (relatedCollection.value) {
		const relations = relationsStore.getRelationsForCollection(relatedCollection.value);
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
				<div class="type-label">{{ $t('related_collection') }}</div>
				<related-collection-select v-model="relatedCollection" :disabled="isExisting" />
			</div>

			<v-input disabled :model-value="currentPrimaryKey" />

			<related-field-select v-model="relatedField" :collection="relatedCollection" />

			<v-icon class="arrow" name="arrow_forward" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ $t('sort_field') }}</v-divider>

			<related-field-select
				v-model="sortField"
				:collection="relatedCollection"
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
						t('referential_action_field_label_o2m', {
							collection: relatedCollection || 'related',
						})
					}}
				</div>
				<v-select
					v-model="onDeselect"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: relatedField }),
							value: 'nullify',
						},
						{
							text: t('referential_action_cascade', {
								collection: relatedCollection,
								field: relatedField,
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
					v-model="onDelete"
					:disabled="collection === relatedCollection"
					:placeholder="$t('choose_action') + '...'"
					:items="[
						{
							text: t('referential_action_set_null', { field: relatedField }),
							value: 'SET NULL',
						},
						{
							text: t('referential_action_set_default', { field: relatedField }),
							value: 'SET DEFAULT',
						},
						{
							text: t('referential_action_cascade', {
								collection: relatedCollection,
								field: relatedField,
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
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-block-start: 48px;

	.v-icon.arrow {
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

.v-input.matches {
	--v-input-color: var(--theme--primary);
}

.v-list {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}

.type-label {
	margin-block-end: 8px;
}

.v-divider {
	margin: 48px 0;
}

.corresponding {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-block-start: 48px;

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
