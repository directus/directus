import { withKnobs, boolean } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import withBackground from '../../../.storybook/decorators/with-background';

import VTabs from './v-tabs.vue';
import VTab from './v-tab/';
import VTabsItems from './v-tabs-items/';
import VTabItem from './v-tab-item/';

import { defineComponent, ref } from '@vue/composition-api';

export default {
	title: 'Components / Tabs',
	decorators: [withKnobs, withPadding, withBackground],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { VTabs, VTab, VTabsItems, VTabItem },
		props: {
			withIcons: {
				default: boolean('With Icons', false),
			},
		},
		setup() {
			const selection = ref([]);
			return { selection };
		},
		template: `
			<div>
				<v-tabs v-model="selection">
					<v-tab><v-icon small v-if="withIcons" name="home" left />Home</v-tab>
					<v-tab><v-icon small v-if="withIcons" name="notifications" left />News</v-tab>
					<v-tab disabled><v-icon small v-if="withIcons" name="help" left />Help</v-tab>
					<v-tab><v-icon small v-if="withIcons" name="chat" left />Chat</v-tab>
					<v-tab><v-icon small v-if="withIcons" name="settings" left />Settings</v-tab>
				</v-tabs>

				<v-tabs-items v-model="selection" style="margin-top: 20px">
					<v-tab-item>Home Section</v-tab-item>
					<v-tab-item>News Section</v-tab-item>
					<v-tab-item>Help Section</v-tab-item>
					<v-tab-item>Chat Section</v-tab-item>
					<v-tab-item>Settings Section</v-tab-item>
				</v-tabs-items>

				<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
			</div>
		`,
	});

export const vertical = () =>
	defineComponent({
		components: { VTabs, VTab },
		props: {
			withIcons: {
				default: boolean('With Icons', false),
			},
		},
		setup() {
			const selection = ref([]);
			return { selection };
		},
		template: `
			<div>
				<div style="display: flex;">
					<v-tabs v-model="selection" :vertical="true" style="width: 160px">
						<v-tab><v-icon small v-if="withIcons" name="home" left /> Home</v-tab>
						<v-tab><v-icon small v-if="withIcons" name="notifications" left /> News</v-tab>
						<v-tab><v-icon small v-if="withIcons" name="help" left /> Help</v-tab>
						<v-tab><v-icon small v-if="withIcons" name="chat" left /> Chat</v-tab>
						<v-tab><v-icon small v-if="withIcons" name="settings" left /> Settings</v-tab>
					</v-tabs>

					<v-tabs-items v-model="selection" style="margin-left: 20px;">
						<v-tab-item>Home Section</v-tab-item>
						<v-tab-item>News Section</v-tab-item>
						<v-tab-item>Help Section</v-tab-item>
						<v-tab-item>Chat Section</v-tab-item>
						<v-tab-item>Settings Section</v-tab-item>
					</v-tabs-items>
				</div>

				<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
			</div>
		`,
	});
