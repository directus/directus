<template>
	<div class="grid">
		<div class="field">
			<div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
			<v-select
				v-model="tableSpacing"
				:items="[
					{
						text: t('layouts.tabular.compact'),
						value: 'compact',
					},
					{
						text: t('layouts.tabular.cozy'),
						value: 'cozy',
					},
					{
						text: t('layouts.tabular.comfortable'),
						value: 'comfortable',
					},
				]"
			/>
		</div>
		<div class="grid-element full">
			<p class="type-label">{{ t('interfaces.table.add_limit') }}</p>
			<v-input v-model="limit" class="input" />
		</div>
		<div class="grid-element full">
			<p class="type-label">{{ t('interfaces.table.edit_columns') }}</p>
			<repeater
				:value="columnsValue"
				:template="`{{ field }} — {{ interface }}`"
				:fields="columnsFields"
				@input="columnsValue = $event"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import Repeater from '@/interfaces/list/list.vue';
import { Field, FieldMeta } from '@directus/types';
import { FIELD_TYPES_SELECT } from '@/constants';
import { DeepPartial } from '@directus/types';
import { translate } from '@/utils/translate-object-values';

export default defineComponent({
	components: { Repeater },
	props: {
		value: {
			type: Object as PropType<any>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const columnsValue = computed({
			get() {
				return props.value?.fields?.map((field: Field) => field.meta);
			},
			set(newVal: FieldMeta[] | null) {
				const fields = (newVal || []).map((meta: Record<string, any>) => ({
					field: meta.field,
					name: meta.name || meta.field,
					type: meta.type,
					meta,
				}));
				emit('input', {
					...(props.value || {}),
					fields: fields,
				});
			},
		});

		const columnsFields: DeepPartial<Field>[] = [
			{
				name: t('field', 1),
				field: 'field',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					sort: 2,
					options: {
						dbSafe: true,
						font: 'monospace',
						placeholder: t('interfaces.table.field_name_placeholder'),
					},
				},
				schema: null,
			},
			{
				name: t('interfaces.table.display_name'),
				field: 'display_name',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					sort: 2,
					options: {
						font: 'monospace',
						placeholder: t('interfaces.table.field_display_name_placeholder'),
					},
				},
				schema: null,
			},
			{
				name: t('field_width'),
				field: 'width',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
					sort: 3,
				},
				schema: null,
			},
			{
				name: t('type'),
				field: 'type',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					sort: 4,
					options: {
						choices: translate(FIELD_TYPES_SELECT),
					},
				},
				schema: null,
			},
			{
				name: t('interface_label'),
				field: 'interface',
				type: 'string',
				meta: {
					interface: 'system-interface',
					width: 'half',
					sort: 5,
					options: {
						typeField: 'type',
					},
				},
				schema: null,
			},
			{
				name: t('note'),
				field: 'note',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'full',
					sort: 6,
					options: {
						placeholder: t('interfaces.table.field_note_placeholder'),
					},
				},
				schema: null,
			},
			{
				name: t('options'),
				field: 'options',
				type: 'string',
				meta: {
					interface: 'system-interface-options',
					width: 'full',
					sort: 7,
					options: {
						interfaceField: 'interface',
					},
				},
			},
		];

		const tableSpacing = computed({
			get() {
				return props.value?.tableSpacing;
			},
			set(newValue: string) {
				emit('input', {
					...(props.value || {}),
					tableSpacing: newValue,
				});
			},
		});

		const limit = computed({
			get() {
				return props.value?.limit;
			},
			set(newValue: string) {
				emit('input', {
					...(props.value || {}),
					limit: newValue,
				});
			},
		});

		return { t, columnsValue, columnsFields, tableSpacing, limit };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;

	&-element {
		&.full {
			grid-column: start/full;
		}
	}
}
</style>
