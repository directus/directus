import { DEFAULT_ASPECT_RATIO } from '@directus/ai';
import { defineOperationApp } from '@directus/extensions';
import { getImageModelChoices } from './fields';
import OptionsComponent from './options.vue';

export default defineOperationApp({
	id: 'ai-image',
	icon: 'image',
	name: '$t:operations.ai-image.name',
	description: '$t:operations.ai-image.description',
	overview: ({ model, aspectRatio, count }) => {
		const choice = getImageModelChoices().find((c) => c.value === model);

		return [
			{ label: '$t:ai.flow_operations.model', text: choice?.text ?? model ?? '--' },
			{
				label: '$t:aspect_ratio',
				text:
					aspectRatio === 'reference'
						? '$t:operations.ai-image.match_reference'
						: (aspectRatio ?? DEFAULT_ASPECT_RATIO),
			},
			{ label: '$t:operations.ai-image.count', text: String(count ?? 1) },
		];
	},
	// OperationAppConfig types component options as `never` (Exclude<ComponentOptions, any>), though the drawer renders them
	options: OptionsComponent as never,
});
