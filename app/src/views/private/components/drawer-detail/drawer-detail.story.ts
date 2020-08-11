import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import markdown from './readme.md';
import { defineComponent, provide, ref, watch } from '@vue/composition-api';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import withAltColors from '../../../../../.storybook/decorators/with-alt-colors';
import { useAppStore } from '@/stores';

export default {
	title: 'Views / Private / Components / Drawer Detail',
	decorators: [withKnobs, withAltColors, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			drawerOpen: {
				default: boolean('Drawer open', true),
			},
			icon: {
				default: text('Icon', 'person'),
			},
			title: {
				default: text('Title', 'People'),
			},
		},
		setup(props) {
			const open = ref(false);
			const appStore = useAppStore();

			appStore.state.drawerOpen = true;

			watch(
				() => props.drawerOpen,
				(newOpen) => (open.value = newOpen)
			);

			provide('item-group', {
				register: () => {},
				unregister: () => {},
				toggle: () => {},
			});
		},
		template: `
			<drawer-detail :title="title" :icon="icon">
				Content
			</drawer-detail>
		`,
	});
