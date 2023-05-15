import { definePanel } from '@directus/utils';
import PanelVariable from './panel-variable.vue';
import { useI18n } from 'vue-i18n';
import { FIELD_TYPES_SELECT } from '@/constants';
import { translate } from '@/utils/translate-object-values';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';

export default definePanel({
	id: 'variable',
	name: '$t:panels.variable.name',
	description: '$t:panels.variable.description',
	icon: 'science',
	component: PanelVariable,
	variable: true,
	options: (panel) => {
		const { t } = useI18n();

		return [
			{
				name: t('panels.variable.variable_key'),
				field: 'field',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'full',
					options: {
						dbSafe: true,
						font: 'monospace',
						placeholder: t('field_name_placeholder'),
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
					options: {
						choices: translate(FIELD_TYPES_SELECT),
					},
				},
			},
			{
				name: t('default_value'),
				field: 'defaultValue',
				type: panel.options?.type,
				meta: {
					interface: panel.options?.type ? getDefaultInterfaceForType(panel.options.type) : 'input',
					readonly: !panel.options?.type,
					width: 'half',
				},
			},
			{
				name: t('interface_label'),
				field: 'inter',
				type: 'string',
				meta: {
					interface: 'system-interface',
					width: 'half',
					options: {
						typeField: 'type',
					},
				},
			},
			{
				name: t('options'),
				field: 'options',
				type: 'string',
				meta: {
					interface: 'system-interface-options',
					width: 'full',
					options: {
						interfaceField: 'inter',
					},
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 6,
	skipUndefinedKeys: ['options'],
});
