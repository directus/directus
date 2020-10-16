import markdown from './readme.md';
import { defineComponent, watch } from '@vue/composition-api';
import { withKnobs, boolean } from '@storybook/addon-knobs';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import withAltColors from '../../../../../.storybook/decorators/with-alt-colors';
import { useAppStore } from '@/stores';

import SidebarButton from './sidebar-button.vue';

export default {
	title: 'Views / Private / Components / Sidebar Button',
	parameters: {
		notes: markdown,
	},
	decorators: [withKnobs, withAltColors, withPadding],
};

export const basic = () =>
	defineComponent({
		components: { SidebarButton },
		props: {
			sidebarOpen: {
				default: boolean('Sidebar Open', true),
			},
		},
		setup(props) {
			const appStore = useAppStore();

			appStore.state.sidebarOpen = props.sidebarOpen;

			watch(
				() => props.sidebarOpen,
				(newOpen) => {
					appStore.state.sidebarOpen = newOpen;
				}
			);
		},
		template: `
			<sidebar-button icon="info">Close Sidebar</sidebar-button>
		`,
	});
