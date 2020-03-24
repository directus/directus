import markdown from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';
import TransitionExpand from './transition-expand.vue';
import withPadding from '../../../../.storybook/decorators/with-padding';

export default {
	title: 'Transition / Expand',
	parameters: {
		notes: markdown,
	},
	decorators: [withPadding],
};

export const basic = () =>
	defineComponent({
		components: { TransitionExpand },
		props: {},
		setup() {
			const active = ref(false);

			return { active, toggle };

			function toggle() {
				active.value = !active.value;
			}
		},
		template: `
			<div>
				<v-button @click="toggle">Click me!</v-button>

				<transition-expand>
					<div v-if="active" style="margin-top: 50px">
						<v-sheet style="--v-sheet-padding: 24px; --v-sheet-background-color: var(--red-100);">
							<h1 class="type-title">Hello, world!</h1>
						</v-sheet>
					</div>
				</transition-expand>
			</div>
		`,
	});
