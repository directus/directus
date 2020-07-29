import withPadding from '../../../.storybook/decorators/with-padding';
import readme from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';

export default {
	title: 'Components / Modal',
	parameters: {
		notes: readme,
	},
	decorators: [withPadding],
};

export const basic = () =>
	defineComponent({
		setup() {
			const active = ref(false);
			return { active };
		},
		template: `
			<div>
				<v-modal
					v-model="active"
					title="Creating New Collection"
					subtitle="called Customers"
				>
					<template #activator="{ on }">
						<v-button @click="on">Enable modal</v-button>
					</template>

					<p>Hello world!</p>

					<template #footer="{ close }">
						<v-button @click="close">Close modal</v-button>
					</template>
				</v-modal>
				<portal-target name="outlet" />
			</div>
		`,
	});

export const withNav = () =>
	defineComponent({
		setup() {
			const active = ref(false);
			const current = ref(['hello']);
			return { active, current };
		},
		template: `
			<div>
				<v-modal
					v-model="active"
					title="Creating New Collection"
					subtitle="called Customers"
				>
					<template #activator="{ on }">
						<v-button @click="on">Enable modal</v-button>
					</template>

					<template #sidebar>
						<v-tabs v-model="current" vertical>
							<v-tab value="hello">Hello</v-tab>
							<v-tab value="introduce">Modal</v-tab>
						</v-tabs>
					</template>

					<v-tabs-items v-model="current">
						<v-tab-item value="hello">
							<p>Hello world!</p>
						</v-tab-item>

						<v-tab-item value="introduce">
							<p>I'm a modal with tabs</p>
						</v-tab-item>
					</v-tabs-items>


					<template #footer="{ close }">
						<v-button @click="close">Close modal</v-button>
					</template>
				</v-modal>
				<portal-target name="outlet" />
			</div>
		`,
	});
