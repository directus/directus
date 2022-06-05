import { defineOperationApp } from '@directus/shared/utils'

export default defineOperationApp({
	id: 'custom',
	icon: 'schedule',
	name: 'Custom',
	description: 'Custom operation',
	overview: ({ customParam }) => [
		{
			label: 'Custom Parameter',
			text: customParam
		}
	],
	options: [
		{
			field: 'customParameter',
			name: 'Custom Parameter',
			type: 'integer',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					min: 0,
					type: 'integer',
					placeholder: '1000'
				}
			}
		}
	]
})
