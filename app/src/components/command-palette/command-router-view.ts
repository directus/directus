import { assign } from 'lodash';
import type { Slot } from 'vue';
import { defineComponent, h } from 'vue';
import { useCommandRouter } from './composables/use-command-router';

export const CommandRouterView = defineComponent({
	name: 'CommandRouterView',
	inheritAttrs: false,
	setup(_, { attrs, slots }) {
		const router = useCommandRouter();

		return () => {
			const currentCommand = router.currentCommand.value;

			const props =
				typeof currentCommand.props === 'function' ? currentCommand.props(currentCommand) : currentCommand.props;

			const ViewComponent = currentCommand.component;

			const component = h(ViewComponent, assign({}, props, attrs));

			return normalizeSlot(slots.default, { Component: component, command: currentCommand }) || component;
		};
	},
});

function normalizeSlot(slot: Slot | undefined, data: any) {
	if (!slot) return null;
	const slotContent = slot(data);
	return slotContent.length === 1 ? slotContent[0] : slotContent;
}
