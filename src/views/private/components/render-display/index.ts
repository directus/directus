import { defineComponent } from '@vue/composition-api';
import displays from '@/displays';
import { DisplayHandlerFunction } from '@/displays/types';

export default defineComponent({
	props: {
		display: {
			type: String,
			default: null,
		},
		options: {
			type: Object,
			default: () => ({}),
		},
		value: {
			type: [String, Number, Object, Array],
			default: null,
		},
	},
	render(createElement, { props }) {
		const display = displays.find((display) => display.id === props.display);

		if (!display) {
			return props.value;
		}

		if (typeof display.handler === 'function') {
			return (display.handler as DisplayHandlerFunction)(props.value, props.options);
		}

		return createElement(`display-${props.display}`, {
			props: {
				...props.options,
				value: props.value,
			},
		});
	},
});
