import VTemplateInput from '../src/components/v-button.vue';
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
    template: '<v-button v-bind="args" >My Button</v-button>',
});

export const Primary = Template.bind({});
Primary.args = {
};