import { boolean, withKnobs } from '@storybook/addon-knobs';
import { defineComponent, ref } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';
import markdown from './readme.md';
import Vue from 'vue';
import VDialog from './v-dialog.vue';

Vue.component('v-dialog', VDialog);

export default {
	title: 'Components / Dialog',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			persistent: {
				default: boolean('Persistent', false),
			},
		},
		setup() {
			const active = ref(false);

			return { active };
		},
		template: `
			<div>
				<v-button @click="active = !active">Activate</v-button>
				<v-dialog v-model="active" :persistent="persistent">
					<v-sheet>
						<h2 class="type-label" style="margin-bottom: 20px">Are you sure you want to delete this item?</h2>
						<v-button @click="active = false" secondary outlined>Cancel</v-button>
						<v-button @click="active = false">Yes</v-button>
					</v-sheet>
				</v-dialog>
				<portal-target name="outlet" />
			</div>
		`,
	});

export const activatorSlot = () =>
	defineComponent({
		props: {
			persistent: {
				default: boolean('Persistent', false),
			},
		},
		setup() {
			const active = ref(false);

			return { active };
		},
		template: `
			<div>
				<v-dialog v-model="active" :persistent="persistent">
					<template #activator="{ on }">
						<p @click="on">Click me to active</p>
					</template>
					<v-sheet>
						<h2 class="type-label" style="margin-bottom: 20px">Are you sure you want to delete this item?</h2>
						<v-button @click="active = false" secondary outlined>Cancel</v-button>
						<v-button @click="active = false">Yes</v-button>
					</v-sheet>
				</v-dialog>
				<portal-target name="outlet" />
			</div>
		`,
	});
