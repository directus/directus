import VIcon from '../src/components/v-icon/v-icon.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
  title: 'Example/VIcon',
  component: VIcon,
  argTypes: {
    
  },
};

const Template = (args, { argTypes }) => ({
  setup() {
    return { args: fix(args, argTypes) };
  },
  template: '<v-icon v-bind="args" v-on="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
  name: 'delete'
};