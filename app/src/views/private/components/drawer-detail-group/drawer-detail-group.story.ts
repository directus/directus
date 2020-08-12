import { withKnobs } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import withAltColors from '../../../../../.storybook/decorators/with-alt-colors';

import { defineComponent } from '@vue/composition-api';
import DrawerDetailGroup from './drawer-detail-group.vue';
import DrawerDetail from '../drawer-detail';
import { useAppStore } from '@/stores';

export default {
	title: 'Views / Private / Components / Drawer Detail Group',
	decorators: [withKnobs, withAltColors, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { DrawerDetailGroup, DrawerDetail },
		setup() {
			const appStore = useAppStore({});
			appStore.state.drawerOpen = false;
		},
		template: `
		<drawer-detail-group>
			<drawer-detail icon="person" title="People">
				Hi there!
			</drawer-detail>
			<drawer-detail icon="settings" title="Settings">
				These sections can be whatever you want them to be
			</drawer-detail>
			<drawer-detail icon="sentiment_satisfied_alt" title="Fun times">
				This is a third section in the sidebar
			</drawer-detail>
			<drawer-detail icon="forum" title="Comments">
				These sections can hold any markup:

				<v-input placeholder="I'm an input" />
			</drawer-detail>
		</drawer-detail-group>`,
	});
