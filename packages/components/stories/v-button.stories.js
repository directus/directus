import VButton from '../src/components/v-button.vue';
document.body.classList.add('light')

export default {
  title: 'Example/VButton',
  component: VButton,
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