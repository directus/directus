import { definePanel } from '@directus/shared/utils';
import PanelVariable from './panel-variable.vue';
import { useI18n } from 'vue-i18n';
import { FIELD_TYPES_SELECT } from '@/constants';
import { translate } from '@/utils/translate-object-values';

export default definePanel({
	id: 'variable',
	name: '$t:panels.variable.name',
	description: '$t:panels.variable.description',
	icon: 'science',
	component: PanelVariable,
	options: () => {
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
						placeholder: t('interfaces.list.field_name_placeholder'),
					},
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
					options: {
						choices: translate(FIELD_TYPES_SELECT),
					},
				},
				schema: null,
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
				schema: null,
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
});
