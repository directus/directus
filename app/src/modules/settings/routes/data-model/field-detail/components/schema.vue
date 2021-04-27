<template>
	<div>
		<div class="form">
			<div class="field">
				<div class="label type-label">
					{{ $t('key') }}
					<v-icon class="required" sup name="star" />
				</div>
				<v-input
					:disabled="isExisting"
					autofocus
					class="monospace"
					v-model="fieldData.field"
					:nullable="false"
					db-safe
					:placeholder="$t('a_unique_column_name')"
				/>
				<small class="note" v-html="$t('schema_setup_key')" />
			</div>

			<div class="field half">
				<div class="label type-label">
					{{ $t('type') }}
					<v-icon class="required" sup name="star" />
				</div>
				<v-input v-if="!fieldData.schema" :value="$t('alias')" disabled />
				<v-select
					v-else
					:disabled="typeDisabled || isExisting"
					:value="fieldData.type"
					:items="typesWithLabels"
					:placeholder="typePlaceholder"
					@input="fieldData.type = $event"
				/>
			</div>

			<template v-if="['decimal', 'float'].includes(fieldData.type) === false">
				<div class="field half" v-if="fieldData.schema">
					<div class="label type-label">{{ $t('length') }}</div>
					<v-input
						type="number"
						:placeholder="fieldData.type !== 'string' ? $t('not_available_for_type') : '255'"
						:disabled="isExisting || fieldData.type !== 'string'"
						v-model="fieldData.schema.max_length"
					/>
				</div>
			</template>

			<template v-else>
				<div class="field half" v-if="fieldData.schema">
					<div class="label type-label">{{ $t('precision_scale') }}</div>
					<div class="precision-scale">
						<v-input type="number" :placeholder="10" v-model="fieldData.schema.numeric_precision" />
						<v-input type="number" :placeholder="5" v-model="fieldData.schema.numeric_scale" />
					</div>
				</div>
			</template>

			<template v-if="['uuid', 'date', 'time', 'dateTime', 'timestamp'].includes(fieldData.type) && type !== 'file'">
				<div class="field half-left">
					<div class="label type-label">{{ $t('on_create') }}</div>
					<v-select :items="onCreateOptions" v-model="onCreateValue" />
				</div>

				<div class="field half-right">
					<div class="label type-label">{{ $t('on_update') }}</div>
					<v-select :items="onUpdateOptions" v-model="onUpdateValue" />
				</div>
			</template>

			<!-- @TODO see https://github.com/directus/directus/issues/639

			<div class="field half-left" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('unique') }}</div>
				<v-checkbox
					:label="$t('value_unique')"
					:input-value="fieldData.schema.is_unique === false"
					@change="fieldData.schema.is_unique = !$event"
					block
				/>
			</div> -->

			<div class="field full" v-if="fieldData.schema && fieldData.schema.is_primary_key !== true">
				<div class="label type-label">{{ $t('default_value') }}</div>
				<v-input
					v-if="['string', 'uuid'].includes(fieldData.type)"
					class="monospace"
					v-model="defaultValue"
					placeholder="NULL"
				/>
				<v-textarea
					v-else-if="['text', 'json'].includes(fieldData.type)"
					class="monospace"
					v-model="defaultValue"
					placeholder="NULL"
				/>
				<v-input
					v-else-if="['integer', 'bigInteger', 'float', 'decimal'].includes(fieldData.type)"
					type="number"
					class="monospace"
					v-model="defaultValue"
					placeholder="NULL"
				/>
				<v-input
					v-else-if="['timestamp', 'dateTime', 'date', 'time'].includes(fieldData.type)"
					class="monospace"
					v-model="defaultValue"
					placeholder="NULL"
				/>
				<v-select
					v-else-if="fieldData.type === 'boolean'"
					class="monospace"
					v-model="defaultValue"
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
				<v-input v-else class="monospace" v-model="defaultValue" disabled placeholder="NULL" />
			</div>

			<div class="field half-left" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('nullable') }}</div>
				<v-checkbox
					:input-value="fieldData.schema.is_nullable"
					@change="fieldData.schema.is_nullable = $event"
					:label="$t('allow_null_value')"
					block
				/>
			</div>

			<div class="field half-right" v-if="fieldData.schema">
				<div class="label type-label">{{ $t('unique') }}</div>
				<v-checkbox
					:input-value="fieldData.schema.is_unique"
					@change="fieldData.schema.is_unique = $event"
					:label="$t('value_unique')"
					block
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import i18n from '@/lang';
import { state } from '../store';

export const fieldTypes = [
	{
		text: i18n.t('string'),
		value: 'string',
	},
	{
		text: i18n.t('text'),
		value: 'text',
	},
	{ divider: true },
	{
		text: i18n.t('boolean'),
		value: 'boolean',
	},
	{ divider: true },
	{
		text: i18n.t('integer'),
		value: 'integer',
	},
	{
		text: i18n.t('bigInteger'),
		value: 'bigInteger',
	},
	{
		text: i18n.t('float'),
		value: 'float',
	},
	{
		text: i18n.t('decimal'),
		value: 'decimal',
	},
	{ divider: true },
	{
		text: i18n.t('timestamp'),
		value: 'timestamp',
	},
	{
		text: i18n.t('datetime'),
		value: 'dateTime',
	},
	{
		text: i18n.t('date'),
		value: 'date',
	},
	{
		text: i18n.t('time'),
		value: 'time',
	},
	{ divider: true },
	{
		text: i18n.t('json'),
		value: 'json',
	},
	{
		text: i18n.t('csv'),
		value: 'csv',
	},
	{
		text: i18n.t('uuid'),
		value: 'uuid',
	},
	{
		text: i18n.t('hash'),
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
	setup(props, { emit }) {
		const typesWithLabels = computed(() => {
			return fieldTypes;
		});

		const typeDisabled = computed(() => {
			return ['file', 'files', 'o2m', 'm2m', 'm2a', 'm2o', 'translations'].includes(props.type);
		});

		const typePlaceholder = computed(() => {
			if (props.type === 'm2o') {
				return i18n.t('determined_by_relationship');
			}

			return i18n.t('choose_a_type');
		});

		const defaultValue = computed({
			get() {
				return state.fieldData.schema.default_value;
			},
			set(newVal: any) {
				state.fieldData.schema.default_value = newVal;
			},
		});

		const { onCreateOptions, onCreateValue } = useOnCreate();
		const { onUpdateOptions, onUpdateValue } = useOnUpdate();

		return {
			fieldData: state.fieldData,
			typesWithLabels,
			typeDisabled,
			typePlaceholder,
			defaultValue,
			onCreateOptions,
			onCreateValue,
			onUpdateOptions,
			onUpdateValue,
		};

		function useOnCreate() {
			const onCreateSpecials = ['uuid', 'user-created', 'role-created', 'date-created'];

			const onCreateOptions = computed(() => {
				if (state.fieldData.type === 'uuid') {
					return [
						{
							text: i18n.t('do_nothing'),
							value: null,
						},
						{
							text: i18n.t('generate_and_save_uuid'),
							value: 'uuid',
						},
						{
							text: i18n.t('save_current_user_id'),
							value: 'user-created',
						},
						{
							text: i18n.t('save_current_user_role'),
							value: 'role-created',
						},
					];
				} else if (['date', 'time', 'dateTime', 'timestamp'].includes(state.fieldData.type)) {
					return [
						{
							text: i18n.t('do_nothing'),
							value: null,
						},
						{
							text: i18n.t('save_current_datetime'),
							value: 'date-created',
						},
					];
				}

				return [];
			});

			const onCreateValue = computed({
				get() {
					const specials = state.fieldData.meta.special || [];

					for (const special of onCreateSpecials) {
						if (specials.includes(special)) {
							return special;
						}
					}

					return null;
				},
				set(newOption: string | null) {
					state.fieldData.meta.special = (state.fieldData.meta.special || []).filter(
						(special: string) => onCreateSpecials.includes(special) === false
					);

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
					return [
						{
							text: i18n.t('do_nothing'),
							value: null,
						},
						{
							text: i18n.t('save_current_user_id'),
							value: 'user-updated',
						},
						{
							text: i18n.t('save_current_user_role'),
							value: 'role-updated',
						},
					];
				} else if (['date', 'time', 'dateTime', 'timestamp'].includes(state.fieldData.type)) {
					return [
						{
							text: i18n.t('do_nothing'),
							value: null,
						},
						{
							text: i18n.t('save_current_datetime'),
							value: 'date-updated',
						},
					];
				}

				return [];
			});

			const onUpdateValue = computed({
				get() {
					const specials = state.fieldData.meta.special || [];

					for (const special of onUpdateSpecials) {
						if (specials.includes(special)) {
							return special;
						}
					}

					return null;
				},
				set(newOption: string | null) {
					state.fieldData.meta.special = (state.fieldData.meta.special || []).filter(
						(special: string) => onUpdateSpecials.includes(special) === false
					);

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
@import '@/styles/mixins/breakpoint';
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
