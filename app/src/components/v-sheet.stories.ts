import VSheet from './v-sheet.vue';

document.body.classList.add('light');

export default {
	title: 'Components/VSheet',
	component: VSheet,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template:
		'<v-sheet v-bind="args" v-on="args" >This is some wanky sheet that is not even used inside Directus.</v-sheet>',
});

export const Primary = Template.bind({});

Primary.args = {};
