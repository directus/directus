<template>
	<div>
		<div class="form">
			<div class="field">
				<div class="label type-label">
					{{ t('key') }}
					<v-icon class="required" sup name="star" />
				</div>
				<v-input
					v-model="fieldData.field"
					:disabled="isExisting"
					autofocus
					class="monospace"
					:nullable="false"
					db-safe
					:placeholder="t('a_unique_column_name')"
				/>
				<small class="note">{{ t('schema_setup_key') }}</small>
			</div>

			<div class="field half">
				<div class="label type-label">
					{{ t('type') }}
					<v-icon class="required" sup name="star" />
				</div>
				<v-input v-if="!fieldData.schema" :model-value="t('alias')" disabled />
				<v-select
					v-else
					:disabled="typeDisabled || isExisting"
					:model-value="fieldData.type"
					:items="typesWithLabels"
					:placeholder="typePlaceholder"
					@update:model-value="fieldData.type = $event"
				/>
			</div>

			<template v-if="fieldData.type == 'geometry'">
				<template v-if="fieldData.schema">
					<div class="field half-right">
						<div class="label type-label">{{ t('interfaces.map.geometry_type') }}</div>
						<v-select
							v-model="fieldData.schema.geometry_type"
							:show-deselect="true"
							:placeholder="t('any')"
							:disabled="isExisting"
							:items="GEOMETRY_TYPES.map((value) => ({ value, text: value }))"
						/>
					</div>
				</template>
			</template>

			<template v-else-if="['decimal', 'float'].includes(fieldData.type) === false">
				<div v-if="fieldData.schema" class="field half">
					<div class="label type-label">{{ t('length') }}</div>
					<v-input
						v-model="fieldData.schema.max_length"
						type="number"
						:placeholder="fieldData.type !== 'string' ? t('not_available_for_type') : '255'"
						:disabled="isExisting || fieldData.type !== 'string'"
					/>
				</div>
			</template>

			<template v-else>
				<div v-if="fieldData.schema" class="field half">
					<div class="label type-label">{{ t('precision_scale') }}</div>
					<div class="precision-scale">
						<v-input v-model="fieldData.schema.numeric_precision" type="number" :placeholder="10" />
						<v-input v-model="fieldData.schema.numeric_scale" type="number" :placeholder="5" />
					</div>
				</div>
			</template>

			<template v-if="hasCreateUpdateTriggers">
				<div class="field half-left">
					<div class="label type-label">{{ t('on_create') }}</div>
					<v-select v-model="onCreateValue" :items="onCreateOptions" />
				</div>

				<div class="field half-right">
					<div class="label type-label">{{ t('on_update') }}</div>
					<v-select v-model="onUpdateValue" :items="onUpdateOptions" />
				</div>
			</template>

			<!-- @TODO see https://github.com/directus/directus/issues/639

			<div class="field half-left" v-if="fieldData.schema">
				<div class="label type-label">{{ t('unique') }}</div>
				<v-checkbox
					:label="t('value_unique')"
					:model-value="fieldData.schema.is_unique === false"
					@update:model-value="fieldData.schema.is_unique = !$event"
					block
				/>
			</div> -->

			<div v-if="fieldData.schema && fieldData.schema.is_primary_key !== true" class="field full">
				<div class="label type-label">{{ t('default_value') }}</div>
				<v-input
					v-if="['string', 'uuid'].includes(fieldData.type)"
					v-model="defaultValue"
					class="monospace"
					placeholder="NULL"
				/>
				<v-textarea
					v-else-if="['text'].includes(fieldData.type)"
					v-model="defaultValue"
					class="monospace"
					placeholder="NULL"
				/>
				<v-input
					v-else-if="['integer', 'bigInteger', 'float', 'decimal'].includes(fieldData.type)"
					v-model="defaultValue"
					type="number"
					class="monospace"
					placeholder="NULL"
				/>
				<v-input
					v-else-if="['timestamp', 'dateTime', 'date', 'time'].includes(fieldData.type)"
					v-model="defaultValue"
					class="monospace"
					placeholder="NULL"
				/>
				<v-select
					v-else-if="fieldData.type === 'boolean'"
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
					v-else-if="fieldData.type === 'json'"
					:value="defaultValue || ''"
					language="JSON"
					placeholder="NULL"
					type="json"
					@input="defaultValue = $event"
				/>
				<v-input v-else v-model="defaultValue" class="monospace" disabled placeholder="NULL" />
			</div>

			<div v-if="fieldData.schema" class="field half-left">
				<div class="label type-label">{{ t('nullable') }}</div>
				<v-checkbox
					:model-value="fieldData.schema.is_nullable"
					:label="t('allow_null_value')"
					block
					@update:model-value="fieldData.schema.is_nullable = $event"
				/>
			</div>

			<div v-if="fieldData.schema" class="field half-right">
				<div class="label type-label">{{ t('unique') }}</div>
				<v-checkbox
					:model-value="fieldData.schema.is_unique"
					:label="t('value_unique')"
					block
					@update:model-value="fieldData.schema.is_unique = $event"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { state } from '../store';
import { GEOMETRY_TYPES } from '@directus/shared/constants';
import { translate } from '@/utils/translate-object-values';

import { Type } from '@directus/shared/types';
import { TranslateResult } from 'vue-i18n';

export const fieldTypes: Array<{ value: Type; text: TranslateResult | string } | { divider: true }> = [
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
		text: '$t:geometry',
		value: 'geometry',
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
];

export default defineComponent({
	props: {
		isExisting: {
			type: Boolean,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const typesWithLabels = computed(() => translate(fieldTypes));

		const typeDisabled = computed(() => {
			return ['file', 'files', 'o2m', 'm2m', 'm2a', 'm2o', 'translations'].includes(props.type);
		});

		const typePlaceholder = computed(() => {
			if (props.type === 'm2o') {
				return t('determined_by_relationship');
			}

			return t('choose_a_type');
		});

		const defaultValue = computed({
			get() {
				return state.fieldData.schema?.default_value;
			},
			set(newVal: any) {
				state.fieldData.schema = {
					...(state.fieldData.schema || {}),
					default_value: newVal,
				};
			},
		});

		const { onCreateOptions, onCreateValue } = useOnCreate();
		const { onUpdateOptions, onUpdateValue } = useOnUpdate();

		const hasCreateUpdateTriggers = computed(() => {
			return (
				['uuid', 'date', 'time', 'dateTime', 'timestamp'].includes(state.fieldData.type || '') && props.type !== 'file'
			);
		});

		return {
			t,
			fieldData: state.fieldData,
			typesWithLabels,
			GEOMETRY_TYPES,
			typeDisabled,
			typePlaceholder,
			defaultValue,
			onCreateOptions,
			onCreateValue,
			onUpdateOptions,
			onUpdateValue,
			hasCreateUpdateTriggers,
		};

		function useOnCreate() {
			const onCreateSpecials = ['uuid', 'user-created', 'role-created', 'date-created'];

			const onCreateOptions = computed(() => {
				if (state.fieldData.type === 'uuid') {
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

					if (props.type === 'm2o' && state.relations[0]?.related_collection === 'directus_users') {
						return options.filter(({ value }) => [null, 'user-created'].includes(value));
					}

					if (props.type === 'm2o' && state.relations[0]?.related_collection === 'directus_roles') {
						return options.filter(({ value }) => [null, 'role-created'].includes(value));
					}

					return options;
				} else if (['date', 'time', 'dateTime', 'timestamp'].includes(state.fieldData.type!)) {
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
					const specials = state.fieldData.meta?.special || [];

					for (const special of onCreateSpecials) {
						if (specials.includes(special)) {
							return special;
						}
					}

					return null;
				},
				set(newOption: string | null) {
					state.fieldData.meta = {
						...(state.fieldData.meta || {}),
						special: (state.fieldData.meta?.special || []).filter(
							(special: string) => onCreateSpecials.includes(special) === false
						),
					};

					if (newOption) {
						state.fieldData.meta.special = [...(state.fieldData.meta.special || []), newOption];
					}
				},
			});

			return { onCreateSpecials, onCreateOptions, onCreateValue };
		}

		function useOnUpdate() {
			const onUpdateSpecials = ['user-updated', 'role-updated', 'date-updated'];

			const onUpdateOptions = computed(() => {
				if (state.fieldData.type === 'uuid') {
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

					if (props.type === 'm2o' && state.relations[0]?.related_collection === 'directus_users') {
						return options.filter(({ value }) => [null, 'user-updated'].includes(value));
					}

					if (props.type === 'm2o' && state.relations[0]?.related_collection === 'directus_roles') {
						return options.filter(({ value }) => [null, 'role-updated'].includes(value));
					}

					return options;
				} else if (['date', 'time', 'dateTime', 'timestamp'].includes(state.fieldData.type!)) {
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
					const specials = state.fieldData.meta?.special || [];

					for (const special of onUpdateSpecials) {
						if (specials.includes(special)) {
							return special;
						}
					}

					return null;
				},
				set(newOption: string | null) {
					state.fieldData.meta = {
						...(state.fieldData.meta || {}),
						special: (state.fieldData.meta?.special || []).filter(
							(special: string) => onUpdateSpecials.includes(special) === false
						),
					};

					if (newOption) {
						state.fieldData.meta.special = [...(state.fieldData.meta.special || []), newOption];
					}
				},
			});

			return { onUpdateSpecials, onUpdateOptions, onUpdateValue };
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form {
	--form-vertical-gap: 32px;
	--form-horizontal-gap: 32px;

	@include form-grid;
}

.note {
	display: block;
	max-width: 520px;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
	--v-select-font-family: var(--family-monospace);
}

.required {
	--v-icon-color: var(--primary);
}

.precision-scale {
	display: grid;
	grid-gap: 12px;
	grid-template-columns: 1fr 1fr;
}

.v-notice {
	margin-bottom: 36px;
}
</style>
