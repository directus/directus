import markdown from './readme.md';
import { defineComponent } from '@vue/composition-api';
import ProjectChooser from './project-chooser.vue';
import withPadding from '../../../../../.storybook/decorators/with-padding';

export default {
	title: 'Views / Public / Components / Logo',
	parameters: {
		notes: markdown,
	},
	decorators: [withPadding],
};

export const basic = () =>
	defineComponent({
		components: { ProjectChooser },
		template: `
			<project-chooser />
		`,
	});
