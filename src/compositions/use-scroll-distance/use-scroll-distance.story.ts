import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import useScrollDistance from './use-scroll-distance';
import Vue from 'vue';

export default {
	title: 'Compositions / Scroll Distance',
	decorators: [withPadding],
};

export const basic = () =>
	defineComponent({
		setup() {
			const el = ref<Vue>(null);
			const { top, left } = useScrollDistance(el);
			return { top, left, el };
		},
		template: `
			<div>
				<v-sheet ref="el" style="--v-sheet-max-width: 150px; --v-sheet-max-height: 150px; overflow: auto;">
					<div style="width: 600px; height: 600px;" />
				</v-sheet>
				<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">
top: {{ top }}
left: {{ left }}
				</pre>
			</div>
		`,
	});
