<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import { useFieldsStore } from '@/stores/fields';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();
const fieldsStore = useFieldsStore();

const relatedCollection = syncFieldDetailStoreProperty('relations.m2o.related_collection');
const correspondingField = syncFieldDetailStoreProperty('fields.corresponding');
const correspondingFieldKey = syncFieldDetailStoreProperty('fields.corresponding.field');
const onDeleteRelated = syncFieldDetailStoreProperty('relations.m2o.schema.on_delete');

const { field, collection, editing, generationInfo } = storeToRefs(fieldDetailStore);

const isExisting = computed(() => editing.value !== '+');

const relatedPrimaryKey = computed(
	() => fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value)?.field ?? 'id',
);

const currentField = computed(() => field.value.field);

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
					special: ['o2m'],
					interface: 'list-o2m',
				},
			};
		} else {
			correspondingField.value = null;
		}
	},
});

const correspondingLabel = computed(() => {
	if (relatedCollection.value) {
		return t('add_o2m_to_collection', { collection: relatedCollection.value });
	}

	return t('add_field_related');
});

const onDeleteOptions = computed(() =>
	[
		{
			text: t('referential_action_set_null', { field: currentField.value }),
			value: 'SET NULL',
		},
		{
			text: t('referential_action_set_default', { field: currentField.value }),
			value: 'SET DEFAULT',
		},
		{
			text: t('referential_action_cascade', {
				collection: collection.value,
				field: currentField.value,
			}),
			value: 'CASCADE',
		},
		{
			text: t('referential_action_no_action', { field: currentField.value }),
			value: 'NO ACTION',
		},
	].filter((o) => !(o.value === 'SET NULL' && field.value.schema?.is_nullable === false)),
);
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

			<v-input disabled :model-value="currentField" />
			<v-input :model-value="relatedPrimaryKey" disabled :placeholder="$t('primary_key') + '...'" />
			<v-icon class="arrow" name="arrow_back" />
		</div>

		<v-divider v-if="!isExisting" large :inline-title="false">{{ $t('corresponding_field') }}</v-divider>

		<div v-if="!isExisting" class="grid">
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

		<div class="relational-triggers">
			<v-divider class="field full" large :inline-title="false">{{ $t('relational_triggers') }}</v-divider>

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
					:disabled="collection === relatedCollection"
					:placeholder="$t('choose_action') + '...'"
					:items="onDeleteOptions"
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

	.v-input.matches {
		--v-input-color: var(--theme--primary);
	}

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

.v-list {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}

.v-divider {
	margin: 48px 0;
}

.type-label {
	margin-block-end: 8px;
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

.relational-triggers {
	--theme--form--column-gap: 12px;
	--theme--form--row-gap: 24px;

	@include mixins.form-grid;

	.v-divider {
		margin-block: 48px 0;
	}
}
</style>
