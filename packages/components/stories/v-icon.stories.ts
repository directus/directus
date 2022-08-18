import VIcon from '../src/components/v-icon/v-icon.vue';
document.body.classList.add('light')

export default {
  title: 'Example/VIcon',
  component: VIcon,
  argTypes: {
    
  },
};

const Template = (args) => ({
  setup() {
    return { args };
  },
  template: '<v-icon v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
  name: 'delete'
};