import markdown from './readme.md';
import { defineComponent, provide, toRefs } from '@vue/composition-api';
import { withKnobs, boolean } from '@storybook/addon-knobs';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import withAltColors from '../../../../../.storybook/decorators/with-alt-colors';

import DrawerButton from './drawer-button.vue';

export default {
	title: 'Views / Private / Components / Drawer Button',
	parameters: {
		notes: markdown
	},
	decorators: [withKnobs, withAltColors, withPadding]
};

export const basic = () =>
	defineComponent({
		components: { DrawerButton },
		props: {
			drawerOpen: {
				default: boolean('Drawer Open', true)
			}
		},
		setup(props) {
			provide('drawer-open', toRefs(props).drawerOpen);
		},
		template: `
			<drawer-button icon="info">Close Drawer</drawer-button>
		`
	});
