import VTextarea from '../src/components/v-textarea.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
  title: 'Example/VTextarea',
  component: VTextarea,
  argTypes: {
    
  },
};

const Template = (args, { argTypes }) => ({
  setup() {
    return { args: fix(args, argTypes) };
  },
  template: '<v-textarea v-bind="args" v-on="args" >My Button</v-textarea>',
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: `This is some text that will be displayed in the textarea.
This is a new line.`
};