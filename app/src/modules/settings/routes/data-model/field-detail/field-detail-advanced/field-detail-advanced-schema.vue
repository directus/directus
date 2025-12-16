<script setup lang="ts">
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextarea from '@/components/v-textarea.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import { translate } from '@/utils/translate-object-values';
import { Type } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

type FieldTypeOption = { value: Type; text: TranslateResult | string; children?: FieldTypeOption[] };

const fieldTypes: Array<FieldTypeOption | { divider: true }> = [
	{
		text: '$t:string',
		value: 'string',
	},
	{
		text: '$t:text',
		value: 'text',
	},
	{ divider: true },
	{
		text: '$t:boolean',
		value: 'boolean',
	},
	{ divider: true },
	{
		text: '$t:integer',
		value: 'integer',
	},
	{
		text: '$t:bigInteger',
		value: 'bigInteger',
	},
	{
		text: '$t:float',
		value: 'float',
	},
	{
		text: '$t:decimal',
		value: 'decimal',
	},
	{ divider: true },
	{
		text: '$t:timestamp',
		value: 'timestamp',
	},
	{
		text: '$t:datetime',
		value: 'dateTime',
	},
	{
		text: '$t:date',
		value: 'date',
	},
	{
		text: '$t:time',
		value: 'time',
	},
	{ divider: true },
	{
		text: '$t:json',
		value: 'json',
	},
	{
		text: '$t:csv',
		value: 'csv',
	},
	{
		text: '$t:uuid',
		value: 'uuid',
	},
	{
		text: '$t:hash',
		value: 'hash',
	},
	{ divider: true },
	{
		text: '$t:geometry.All',
		value: 'geometry',
	},
	{
		text: '$t:geometry.Point',
		value: 'geometry.Point',
	},
	{
		text: '$t:geometry.LineString',
		value: 'geometry.LineString',
	},
	{
		text: '$t:geometry.Polygon',
		value: 'geometry.Polygon',
	},
	{
		text: '$t:geometry.MultiPoint',
		value: 'geometry.MultiPoint',
	},
	{
		text: '$t:geometry.MultiLineString',
		value: 'geometry.MultiLineString',
	},
	{
		text: '$t:geometry.MultiPolygon',
		value: 'geometry.MultiPolygon',
	},
];

const fieldDetailStore = useFieldDetailStore();

const { localType, relations, editing } = storeToRefs(fieldDetailStore);

const isExisting = computed(() => editing.value !== '+');

const type = syncFieldDetailStoreProperty('field.type');
const defaultValue = syncFieldDetailStoreProperty('field.schema.default_value');
const field = syncFieldDetailStoreProperty('field.field');
const special = syncFieldDetailStoreProperty('field.meta.special');
const maxLength = syncFieldDetailStoreProperty('field.schema.max_length');
const numericPrecision = syncFieldDetailStoreProperty('field.schema.numeric_precision');
const nullable = syncFieldDetailStoreProperty('field.schema.is_nullable', true);
const unique = syncFieldDetailStoreProperty('field.schema.is_unique', false);
const indexed = syncFieldDetailStoreProperty('field.schema.is_indexed', false);
const numericScale = syncFieldDetailStoreProperty('field.schema.numeric_scale');

const { t } = useI18n();

const typesWithLabels = computed(() => translate(fieldTypes));

const typeDisabled = computed(() => localType.value !== 'standard');

const typePlaceholder = computed(() => {
	if (localType.value === 'm2o') {
		return t('determined_by_relationship');
	}

	return t('choose_a_type');
});

const { onCreateOptions, onCreateValue } = useOnCreate();
const { onUpdateOptions, onUpdateValue } = useOnUpdate();

const hasCreateUpdateTriggers = computed(() => {
	return ['uuid', 'date', 'time', 'dateTime', 'timestamp'].includes(type.value) && localType.value !== 'file';
});

const isAlias = computed(() => {
	return !fieldDetailStore.field.schema;
});

const isPrimaryKey = computed(() => {
	return fieldDetailStore.field.schema?.is_primary_key === true;
});

const isGenerated = computed(() => {
	return fieldDetailStore.field.schema?.is_generated;
});

function useOnCreate() {
	const onCreateSpecials = ['uuid', 'user-created', 'role-created', 'date-created'];

	const onCreateOptions = computed(() => {
		if (type.value === 'uuid') {
			const options = [
				{
					text: t('do_nothing'),
					value: null,
				},
				{
					text: t('generate_and_save_uuid'),
					value: 'uuid',
				},
				{
					text: t('save_current_user_id'),
					value: 'user-created',
				},
				{
					text: t('save_current_user_role'),
					value: 'role-created',
				},
			];

			if (localType.value === 'm2o' && relations.value.m2o?.related_collection === 'directus_users') {
				return options.filter(({ value }) => [null, 'user-created'].includes(value));
			}

			if (localType.value === 'm2o' && relations.value.m2o?.related_collection === 'directus_roles') {
				return options.filter(({ value }) => [null, 'role-created'].includes(value));
			}

			return options;
		} else if (['date', 'time', 'dateTime', 'timestamp'].includes(type.value!)) {
			return [
				{
					text: t('do_nothing'),
					value: null,
				},
				{
					text: t('save_current_datetime'),
					value: 'date-created',
				},
			];
		}

		return [];
	});

	const onCreateValue = computed({
		get() {
			const specials = special.value ?? [];

			for (const special of onCreateSpecials) {
				if (specials.includes(special)) {
					return special;
				}
			}

			return null;
		},
		set(newOption: string | null) {
			// In case of previously persisted empty string
			if (typeof special.value === 'string') {
				special.value = [];
			}

			special.value = (special.value ?? []).filter((special: string) => onCreateSpecials.includes(special) === false);

			if (newOption) {
				special.value = [...(special.value ?? []), newOption];
			}

			// Prevent empty array saved as empty string
			if (special.value && special.value.length === 0) {
				special.value = null;
			}
		},
	});

	return { onCreateSpecials, onCreateOptions, onCreateValue };
}

function useOnUpdate() {
	const onUpdateSpecials = ['user-updated', 'role-updated', 'date-updated'];

	const onUpdateOptions = computed(() => {
		if (type.value === 'uuid') {
			const options = [
				{
					text: t('do_nothing'),
					value: null,
				},
				{
					text: t('save_current_user_id'),
					value: 'user-updated',
				},
				{
					text: t('save_current_user_role'),
					value: 'role-updated',
				},
			];

			if (localType.value === 'm2o' && relations.value.m2o?.related_collection === 'directus_users') {
				return options.filter(({ value }) => [null, 'user-updated'].includes(value));
			}

			if (localType.value === 'm2o' && relations.value.m2o?.related_collection === 'directus_roles') {
				return options.filter(({ value }) => [null, 'role-updated'].includes(value));
			}

			return options;
		} else if (['date', 'time', 'dateTime', 'timestamp'].includes(type.value!)) {
			return [
				{
					text: t('do_nothing'),
					value: null,
				},
				{
					text: t('save_current_datetime'),
					value: 'date-updated',
				},
			];
		}

		return [];
	});

	const onUpdateValue = computed({
		get() {
			const specials = special.value ?? [];

			for (const special of onUpdateSpecials) {
				if (specials.includes(special)) {
					return special;
				}
			}

			return null;
		},
		set(newOption: string | null) {
			// In case of previously persisted empty string
			if (typeof special.value === 'string') {
				special.value = [];
			}

			special.value = (special.value ?? []).filter((special: string) => onUpdateSpecials.includes(special) === false);

			if (newOption) {
				special.value = [...(special.value ?? []), newOption];
			}

			// Prevent empty array saved as empty string
			if (special.value && special.value.length === 0) {
				special.value = null;
			}
		},
	});

	return { onUpdateSpecials, onUpdateOptions, onUpdateValue };
}
</script>

<template>
	<div>
		<div class="form">
			<div class="field">
				<div class="label type-label">
					{{ $t('key') }}
					<v-icon class="required" sup name="star" filled />
				</div>

				<v-input
					v-model="field"
					:disabled="isExisting"
					autofocus
					class="monospace"
					:nullable="false"
					db-safe
					:placeholder="$t('a_unique_column_name')"
				/>

				<small class="type-note">{{ $t('schema_setup_key') }}</small>
			</div>

			<div class="field half">
				<div class="label type-label">
					{{ $t('type') }}
					<v-icon class="required" sup name="star" filled />
				</div>
				<v-input v-if="isAlias" :model-value="$t('alias')" disabled />
				<v-select
					v-else
					v-model="type"
					:disabled="typeDisabled || isExisting"
					:items="typesWithLabels"
					:placeholder="typePlaceholder"
				/>
			</div>

			<template v-if="['decimal', 'float'].includes(type) === false">
				<div v-if="!isAlias" class="field half">
					<div class="label type-label">{{ $t('length') }}</div>
					<v-input
						v-model="maxLength"
						type="number"
						:min="1"
						:placeholder="type !== 'string' ? $t('not_available_for_type') : '255'"
						:disabled="isExisting || type !== 'string'"
					/>
				</div>
			</template>

			<template v-else>
				<div v-if="!isAlias" class="field half">
					<div class="label type-label">{{ $t('precision_scale') }}</div>
					<div class="precision-scale">
						<v-input v-model="numericPrecision" type="number" :placeholder="10" />
						<v-input v-model="numericScale" type="number" :placeholder="5" />
					</div>
				</div>
			</template>

			<template v-if="hasCreateUpdateTriggers">
				<div class="field half-left">
					<div class="label type-label">{{ $t('on_create') }}</div>
					<v-select v-model="onCreateValue" :items="onCreateOptions" />
				</div>

				<div class="field half-right">
					<div class="label type-label">{{ $t('on_update') }}</div>
					<v-select v-model="onUpdateValue" :items="onUpdateOptions" />
				</div>
			</template>

			<div v-if="!isAlias && !isPrimaryKey && !isGenerated" class="field full">
				<div class="label type-label">{{ $t('default_value') }}</div>

				<v-input v-if="['string', 'uuid'].includes(type)" v-model="defaultValue" class="monospace" placeholder="NULL" />

				<v-textarea v-else-if="['text'].includes(type)" v-model="defaultValue" class="monospace" placeholder="NULL" />
				<v-input
					v-else-if="['integer', 'bigInteger', 'float', 'decimal'].includes(type)"
					v-model="defaultValue"
					type="number"
					class="monospace"
					placeholder="NULL"
				/>
				<v-input
					v-else-if="['timestamp', 'dateTime', 'date', 'time'].includes(type)"
					v-model="defaultValue"
					class="monospace"
					placeholder="NULL"
				/>
				<v-select
					v-else-if="type === 'boolean'"
					v-model="defaultValue"
					class="monospace"
					:items="[
						{
							text: 'true',
							value: true,
						},
						{
							text: 'false',
							value: false,
						},
						{
							text: 'NULL',
							value: null,
						},
					]"
				/>
				<interface-input-code
					v-else-if="type === 'json'"
					:value="defaultValue"
					language="JSON"
					placeholder="NULL"
					type="json"
					@input="defaultValue = $event"
				/>
				<v-input v-else v-model="defaultValue" class="monospace" disabled placeholder="NULL" />
			</div>

			<div v-if="!isAlias" class="field half-left">
				<div class="label type-label">{{ $t('nullable') }}</div>
				<v-checkbox v-model="nullable" :disabled="isGenerated || isPrimaryKey" :label="$t('allow_null_value')" block />
			</div>

			<div v-if="!isAlias" class="field half-right">
				<div class="label type-label">{{ $t('unique') }}</div>
				<v-checkbox v-model="unique" :disabled="isGenerated || isPrimaryKey" :label="$t('value_unique')" block />
			</div>

			<div v-if="!isAlias" class="field half-left">
				<div class="label type-label">{{ $t('index') }}</div>
				<v-checkbox v-model="indexed" :disabled="isGenerated || isPrimaryKey" :label="$t('value_index')" block />
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.form {
	--theme--form--row-gap: 32px;
	--theme--form--column-gap: 32px;
	@include mixins.form-grid;
}

.type-note {
	position: relative;
	display: block;
	max-inline-size: 520px;
	margin-block-start: 4px;
}

.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
}

.required {
	--v-icon-color: var(--theme--primary);
}

.precision-scale {
	display: grid;
	gap: 12px;
	grid-template-columns: 1fr 1fr;
}

.v-notice {
	margin-block-end: 36px;
}
</style>
