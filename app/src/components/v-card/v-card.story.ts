import { withKnobs, boolean } from '@storybook/addon-knobs';
import Vue from 'vue';
import VCard from './v-card.vue';
import VCardTitle from './v-card-title.vue';
import VCardSubtitle from './v-card-subtitle.vue';
import VCardText from './v-card-text.vue';
import VCardActions from './v-card-actions.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';

Vue.component('v-card', VCard);
Vue.component('v-card-title', VCardTitle);
Vue.component('v-card-subtitle', VCardSubtitle);
Vue.component('v-card-text', VCardText);
Vue.component('v-card-actions', VCardActions);

export default {
	title: 'Components / Card',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
			tile: {
				default: boolean('Tile', false),
			},
		},
		template: `
			<v-card :disabled="disabled" :tile="tile">
				<v-card-title>Hello World!</v-card-title>
				<v-card-subtitle>This is the subtitle</v-card-subtitle>
				<v-card-text>Black ray-bans, you know she's with the band. Such a sight to see and it's all for me. Heaven is jealous of our love, angels are crying from up above. Turned the bedroom into a fair (a fair!) It’s in the palm of your hand now baby.</v-card-text>
			</v-card>
		`,
	});

export const withImage = () =>
	defineComponent({
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
			tile: {
				default: boolean('Tile', false),
			},
		},
		template: `
			<v-card :disabled="disabled" :tile="tile">
				<img src="https://images.unsplash.com/photo-1581587118469-a117038c0249?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800" width="800" height="600" style="width: 100%; display: block; height: auto; "/>
				<v-card-title>Hello World!</v-card-title>
				<v-card-subtitle>This is the subtitle</v-card-subtitle>
				<v-card-text>Black ray-bans, you know she's with the band. Such a sight to see and it's all for me. Heaven is jealous of our love, angels are crying from up above. Turned the bedroom into a fair (a fair!) It’s in the palm of your hand now baby.</v-card-text>
			</v-card>
		`,
	});

export const withActions = () =>
	defineComponent({
		template: `
			<v-card :disabled="disabled" :tile="tile">
				<v-card-title>Hello World!</v-card-title>
				<v-card-subtitle>This is the subtitle</v-card-subtitle>
				<v-card-text>Black ray-bans, you know she's with the band. Such a sight to see and it's all for me. Heaven is jealous of our love, angels are crying from up above. Turned the bedroom into a fair (a fair!) It’s in the palm of your hand now baby.</v-card-text>
				<v-card-actions>
					<v-button small secondary>Click me</v-button>
					<v-button small>Click me</v-button>
				</v-card-actions>
			</v-card>
		`,
	});

export const asDialog = () =>
	defineComponent({
		setup() {
			const active = ref(false);
			return { active };
		},
		template: `
		<v-dialog v-model="active">
			<template #activator="{ on }">
				<v-button @click="on">Show dialog</v-button>
			</template>
			<v-card>
				<v-card-title>Are you sure you want to quit?</v-card-title>
				<v-card-text>All unsaved changes will be lost.</v-card-text>
				<v-card-actions>
					<v-button secondary @click="active = !active">Cancel</v-button>
					<v-button @click="active = !active">Quit</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	`,
	});
