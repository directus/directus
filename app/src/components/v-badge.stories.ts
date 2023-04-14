import VBadge from './v-badge.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VBadge',
	component: VBadge,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-badge v-bind="args" v-on="args" ><v-icon name="notifications_active" /></v-badge>',
});

export const Primary = Template.bind({});

Primary.args = {
	value: '+9',
};
