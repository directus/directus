import VBreadcrumb from './v-breadcrumb.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VBreadcrumb',
	component: VBreadcrumb,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-breadcrumb v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});

Primary.args = {
	items: [
		{
			to: '/',
			name: 'Home',
		},
		{
			to: '/settings',
			name: 'settings',
			icon: 'settings',
		},
		{
			to: '/settings/profile',
			name: 'Profile',
			icon: 'person',
			disabled: true,
		},
	],
};
