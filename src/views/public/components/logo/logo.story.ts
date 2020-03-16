import markdown from './readme.md';
import { defineComponent } from '@vue/composition-api';
import PublicViewLogo from './logo.vue';
import withPadding from '../../../../../.storybook/decorators/with-padding';

export default {
	title: 'Views / Public / Components / Logo',
	parameters: {
		notes: markdown
	},
	decorators: [withPadding]
};

export const basic = () =>
	defineComponent({
		components: { PublicViewLogo },
		template: `
		<public-view-logo version="9.0.0" />
	`
	});
