import { withKnobs, text, boolean, color, optionsKnob as options } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import VForm from './v-form.vue';
import { defineComponent } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/fields';

Vue.component('v-form', VForm);

export default {
	title: 'Components / Form',
	parameters: {
		notes: markdown
	},
	decorators: [withPadding]
};

export const basic = () =>
	defineComponent({
		setup() {
			const fieldsStore = useFieldsStore({});
			fieldsStore.state.fields = [
				{
					collection: 'articles',
					field: 'title',
					datatype: 'VARCHAR',
					unique: false,
					primary_key: false,
					auto_increment: false,
					default_value: null,
					note: '',
					signed: true,
					id: 197,
					type: 'string',
					sort: 2,
					interface: 'text-input',
					hidden_detail: false,
					hidden_browse: false,
					required: false,
					options: {
						monospace: true
					},
					locked: false,
					translation: null,
					readonly: false,
					width: 'full',
					validation: null,
					group: null,
					length: '65535',
					name: 'Title'
				}
			];
		},
		template: `
		<v-form
			collection="articles"
			:initial-values="{
				title: 'Hello World!'
			}"
		/>
	`
	});
