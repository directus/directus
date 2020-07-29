import { withKnobs, boolean, object } from '@storybook/addon-knobs';
import ClickOutside from './click-outside';
import { defineComponent, ref } from '@vue/composition-api';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

export default {
	title: 'Directives / Click Outside',
	parameters: {
		notes: markdown,
	},
	decorators: [withPadding, withKnobs],
};

export const basic = () =>
	defineComponent({
		directives: {
			'click-outside': ClickOutside,
		},
		setup() {
			const count = ref(0);
			return { count };
		},
		template: `
			<v-sheet
				style="--v-sheet-background-color: var(--red-50);"
				v-click-outside="() => (count = count + 1)"
			>
				You've clicked outside me {{ count }} times.
			</v-sheet>
		`,
	});

export const withOptions = () =>
	defineComponent({
		directives: {
			'click-outside': ClickOutside,
		},
		props: {
			events: {
				default: object('Events', ['dblclick']),
			},
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const count = ref(0);
			return { count };
		},
		template: `
			<v-sheet
				style="--v-sheet-background-color: var(--red-50);"
				v-click-outside="{
					handler: () => (count = count + 1),
					events: events,
					disabled: disabled
				}"
			>
				You've <code style="font-family: monospace;">{{ events.join(', ') }}</code>'ed outside me {{ count }} times.
			</v-sheet>
		`,
	});

export const withMiddleware = () =>
	defineComponent({
		directives: {
			'click-outside': ClickOutside,
		},
		setup() {
			const count = ref(0);
			return { count, middleware };

			function middleware(event: any) {
				return event.target.classList.contains('prevent') === false;
			}
		},
		template: `
			<div>
				<v-sheet
					style="--v-sheet-background-color: var(--red-50);"
					v-click-outside="{
						handler: () => (count = count + 1),
						middleware: middleware
					}"
				>
					You've clicked outside me {{ count }} times.
				</v-sheet>

				<v-sheet
					class="prevent"
					style="--v-sheet-background-color: var(--blue-50); margin-top: 100px;"
				>
					Clicking here doesn't count though
				</v-sheet>
			</div>
		`,
	});
