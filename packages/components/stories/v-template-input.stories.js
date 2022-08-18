import VTemplateInput from '../src/components/v-template-input.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VTemplateInput',
    component: VTemplateInput,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-template-input v-bind="args" >My Button</v-template-input>',
});

export const Primary = Template.bind({});
Primary.args = {
};