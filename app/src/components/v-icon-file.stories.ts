import VIconFile from './v-icon-file.vue';
document.body.classList.add('light');

export default {
	title: 'Components/VIconFile',
	component: VIconFile,
	argTypes: {},
};

const Template = (args) => ({
	setup() {
		return { args };
	},
	template: '<v-icon-file v-bind="args" v-on="args" >My Button</v-icon-file>',
});

export const Primary = Template.bind({});
Primary.args = {
	ext: 'png',
};
