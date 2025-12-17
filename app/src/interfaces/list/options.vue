<script setup lang="ts">
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { FIELD_TYPES_SELECT } from '@/constants';
import InterfaceSystemInputTranslatedString from '@/interfaces/_system/system-input-translated-string/input-translated-string.vue';
import { translate } from '@/utils/translate-object-values';
import { DeepPartial, Field, FieldMeta } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Repeater from './list.vue';

const props = defineProps<{
	value: Record<string, any> | null;
	collection: string;
}>();

const emit = defineEmits<{
	(e: 'input', value: Record<string, any> | null): void;
}>();

const { t } = useI18n();

const repeaterValue = computed({
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
			fields,
		});
	},
});

const repeaterFields: DeepPartial<Field>[] = [
	{
		name: t('field', 1),
		field: 'field',
		type: 'string',
		meta: {
			interface: 'input',
			width: 'half',
			sort: 2,
			required: true,
			options: {
				dbSafe: true,
				font: 'monospace',
				placeholder: t('field_name_placeholder'),
			},
		},
	},
	{
		name: t('field_width'),
		field: 'width',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			width: 'half',
			sort: 3,
			options: {
				choices: [
					{
						value: 'half',
						text: t('half_width'),
					},
					{
						value: 'full',
						text: t('full_width'),
					},
				],
			},
		},
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
	},
	{
		name: t('required'),
		field: 'required',
		type: 'boolean',
		meta: {
			interface: 'boolean',
			sort: 5,
			options: {
				label: t('requires_value'),
			},
			width: 'half',
		},
	},
	{
		name: t('note'),
		field: 'note',
		type: 'string',
		meta: {
			interface: 'system-input-translated-string',
			width: 'full',
			sort: 6,
			options: {
				placeholder: t('interfaces.list.field_note_placeholder'),
			},
		},
	},
	{
		name: t('interfaces.list.interface_group'),
		field: 'group-interface',
		type: 'alias',
		meta: {
			interface: 'group-detail',
			field: 'group-interface',
			width: 'full',
			sort: 7,
			options: {
				start: 'open',
			},
			collection: props.collection,
			special: ['group', 'no-data', 'alias'],
		},
	},
	{
		name: t('interface_label'),
		field: 'interface',
		type: 'string',
		meta: {
			interface: 'system-interface',
			width: 'half',
			sort: 8,
			group: 'group-interface',
			options: {
				typeField: 'type',
			},
		},
	},
	{
		name: t('interface_options'),
		field: 'options',
		type: 'string',
		meta: {
			interface: 'system-interface-options',
			width: 'full',
			sort: 9,
			group: 'group-interface',
			options: {
				interfaceField: 'interface',
			},
		},
	},
	{
		name: t('interfaces.list.display_group'),
		field: 'group-display',
		type: 'alias',
		meta: {
			interface: 'group-detail',
			field: 'group-display',
			width: 'full',
			sort: 10,
			options: {
				start: 'closed',
			},
			collection: props.collection,
			special: ['group', 'no-data', 'alias'],
		},
	},
	{
		name: t('display_label'),
		field: 'display',
		type: 'string',
		meta: {
			interface: 'system-display',
			width: 'half',
			group: 'group-display',
			sort: 11,
			options: {
				typeField: 'type',
			},
		},
	},
	{
		name: t('display_options'),
		field: 'display_options',
		type: 'string',
		meta: {
			interface: 'system-display-options',
			width: 'full',
			group: 'group-display',
			sort: 12,
			options: {
				displayField: 'display',
			},
		},
	},
];

const template = computed({
	get() {
		return props.value?.template;
	},
	set(newTemplate: string) {
		emit('input', {
			...(props.value || {}),
			template: newTemplate,
		});
	},
});

const addLabel = computed({
	get() {
		return props.value?.addLabel;
	},
	set(newAddLabel: string) {
		emit('input', {
			...(props.value || {}),
			addLabel: newAddLabel,
		});
	},
});

const sort = computed({
	get() {
		return props.value?.sort;
	},
	set(newSort: string) {
		emit('input', {
			...(props.value || {}),
			sort: newSort,
		});
	},
});

const sortFields = computed(() => {
	if (!repeaterValue.value) return [];

	return repeaterValue.value.map((val) => {
		return { text: val.field, value: val.field };
	});
});
</script>

<template>
	<div class="grid">
		<div class="grid-element half">
			<p class="type-label">{{ $t('template') }}</p>
			<VInput v-model="template" class="input" :placeholder="`{{ field }}`" />
		</div>

		<div class="grid-element half">
			<p class="type-label">{{ $t('interfaces.list.add_label') }}</p>
			<InterfaceSystemInputTranslatedString
				:value="addLabel"
				class="input"
				:placeholder="$t('create_new')"
				@input="addLabel = $event"
			/>
		</div>
		<div class="grid-element half-left">
			<p class="type-label">{{ $t('interfaces.list.sort') }}</p>
			<VSelect
				v-model="sort"
				class="input"
				:items="sortFields"
				show-deselect
				:placeholder="$t('interfaces.list.sort_placeholder')"
			/>
		</div>

		<div class="grid-element full">
			<p class="type-label">{{ $t('interfaces.list.edit_fields') }}</p>
			<Repeater
				:value="repeaterValue"
				template="{{ field }} — {{ interface }}"
				:fields="repeaterFields"
				@input="repeaterValue = $event"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	@include mixins.form-grid;

	&-element {
		&.full {
			grid-column: start/full;
		}
	}
}
</style>
