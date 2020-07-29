import { withKnobs, boolean, number } from '@storybook/addon-knobs';
import withPadding from '../../../.storybook/decorators/with-padding';
import markdown from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';

import VPagination from './v-pagination.vue';

export default {
	title: 'Components / Pagination',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { VPagination },
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
			length: {
				default: number('Length', 10),
			},
			totalVisible: {
				default: number('Total Visible', 5),
			},
			showFirstLast: {
				default: boolean('Show first/last', false),
			},
		},
		setup() {
			const currentPage = ref(1);
			return { currentPage };
		},
		template: `
			<v-pagination
				v-model="currentPage"
				:length="length"
				:total-visible="totalVisible"
				:disabled="disabled"
				:show-first-last="showFirstLast"
			/>
		`,
	});
