import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / User',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			circle: {
				default: boolean('Circle', false),
			},
			display: {
				default: select('Display', ['avatar', 'name'], 'avatar'),
			},
		},
		setup() {
			const user = {
				id: 1,
				avatar: {
					data: {
						thumbnails: [
							{
								key: 'system-small-crop',
								url: 'https://demo.directus.io/thumper/assets/pnw7s9lqy68048g0?key=system-small-crop',
							},
						],
					},
				},
				first_name: 'John',
				last_name: 'Smith',
			};
			return { user };
		},
		template: `
    <div style="max-width: 100px;">
      <display-user :display="display" :circle="circle" :value="user"/>
    </div>
    `,
	});
