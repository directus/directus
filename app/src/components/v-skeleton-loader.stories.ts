import VSkeletonLoader from './v-skeleton-loader.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VSkeletonLoader',
	component: VSkeletonLoader,
	argTypes: {
		type: {
			control: 'select',
			options: ['input', 'input-tall', 'block-list-item', 'block-list-item-dense', 'text', 'list-item-icon'],
		},
	},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-skeleton-loader v-bind="args" v-on="args"  />',
});

export const Primary = Template.bind({});

Primary.args = {};
