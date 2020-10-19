import { withKnobs } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import withAltColors from '../../../../../.storybook/decorators/with-alt-colors';

import { defineComponent } from '@vue/composition-api';
import SidebarDetailGroup from './sidebar-detail-group.vue';
import SidebarDetail from '../sidebar-detail';
import { useAppStore } from '@/stores';

export default {
	title: 'Views / Private / Components / Sidebar Detail Group',
	decorators: [withKnobs, withAltColors, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { SidebarDetailGroup, SidebarDetail },
		setup() {
			const appStore = useAppStore({});
			appStore.state.sidebarOpen = false;
		},
		template: `
		<sidebar-detail-group>
			<sidebar-detail icon="person" title="People">
				Hi there!
			</sidebar-detail>
			<sidebar-detail icon="settings" title="Settings">
				These sections can be whatever you want them to be
			</sidebar-detail>
			<sidebar-detail icon="sentiment_satisfied_alt" title="Fun times">
				This is a third section in the sidebar
			</sidebar-detail>
			<sidebar-detail icon="forum" title="Comments">
				These sections can hold any markup:

				<v-input placeholder="I'm an input" />
			</sidebar-detail>
		</sidebar-detail-group>`,
	});
