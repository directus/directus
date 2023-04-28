import VAvatar from './v-avatar.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VAvatar',
	component: VAvatar,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-avatar v-bind="args" v-on="args" ><v-icon name="person" /></v-avatar>',
});

export const Primary = Template.bind({});

Primary.args = {};
