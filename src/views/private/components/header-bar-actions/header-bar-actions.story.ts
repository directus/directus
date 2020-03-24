import markdown from './readme.md';
import HeaderBarActions from './header-bar-actions.vue';
import { defineComponent } from '@vue/composition-api';
import withPadding from '../../../../../.storybook/decorators/with-padding';

export default {
	title: 'Views / Private / Components / Header Bar Actions',
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { HeaderBarActions },
		template: `
			<div style="display: flex; justify-content: flex-end; position: relative; height: 44px;">
				<header-bar-actions>
					<v-button rounded icon style="--v-button-background-color: var(--success);">
						<v-icon name="add" />
					</v-button>
					<v-button rounded icon style="--v-button-background-color: var(--warning);">
						<v-icon name="delete" />
					</v-button>
					<v-button rounded icon style="--v-button-background-color: var(--danger);">
						<v-icon name="favorite" />
					</v-button>
				</header-bar-actions>
			</div>
		`,
	});
