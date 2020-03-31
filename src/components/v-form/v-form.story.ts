import Vue from 'vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import VForm from './v-form.vue';
import { defineComponent } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/fields';
import { FormField } from './types';

Vue.component('v-form', VForm);

export default {
	title: 'Components / Form',
	parameters: {
		notes: markdown,
	},
	decorators: [withPadding],
};

export const collection = () =>
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
						monospace: true,
					},
					locked: false,
					translation: null,
					readonly: false,
					width: 'full',
					validation: null,
					group: null,
					length: '65535',
					name: 'Title',
				},
			];
		},
		template: `
			<v-form
				collection="articles"
				:initial-values="{
					title: 'Hello World!'
				}"
			/>
		`,
	});

export const fields = () =>
	defineComponent({
		setup() {
			const fields: FormField[] = [
				{
					field: 'field',
					name: 'My Field',
					interface: 'text-input',
					width: 'half',
					options: { placeholder: 'First Field' },
					sort: 1,
				},
				{
					field: 'another-field',
					name: 'Another Field',
					interface: 'text-input',
					width: 'half',
					options: null,
					sort: 2,
				},
				{
					field: 'third-field',
					name: 'A Third Field',
					interface: 'text-input',
					width: 'full',
					options: null,
					sort: 3,
				},
			];

			return { fields };
		},
		template: `
			<v-form
				:fields="fields"
				:initial-values="{
					title: 'Hello World!'
				}"
			/>
		`,
	});
