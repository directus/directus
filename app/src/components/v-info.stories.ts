import VInfo from './v-info.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VInfo',
	component: VInfo,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-info v-bind="args" v-on="args" >You have sadly eaten all the cookies!</v-info>',
});

export const Primary = Template.bind({});

Primary.args = {
	title: 'No more cookies',
	icon: 'cookie',
};
