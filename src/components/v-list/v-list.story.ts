import { withKnobs, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VList from './v-list.vue';
import VListItem from './v-list-item.vue';
import withPadding from '../../../.storybook/decorators/with-padding';
import VListItemContent from './v-list-item-content.vue';
import VSheet from '../v-sheet';
import VueRouter from 'vue-router';
import markdown from './v-list.readme.md';

Vue.component('v-list', VList);
Vue.component('v-list-item', VListItem);
Vue.component('v-list-item-content', VListItemContent);
Vue.component('v-sheet', VSheet);

Vue.use(VueRouter);
const router = new VueRouter();

export default {
	title: 'Components / List',
	component: VList,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const basic = () => ({
	props: {
		dense: {
			default: boolean('Dense', false, 'Full List')
		},
		dense0: {
			default: boolean('Dense', false, 'List Item 0')
		},
		dense1: {
			default: boolean('Dense', false, 'List Item 1')
		},
		dense2: {
			default: boolean('Dense', false, 'List Item 2')
		},
		dense3: {
			default: boolean('Dense', false, 'List Item 3')
		},
		nav: {
			default: boolean('Nav', false, 'Full List')
		}
	},
	data() {
		return {
			items: ['Item 0', 'Item 1', 'Item 2', 'Item 3']
		};
	},
	template: `
	<v-sheet style="--v-sheet-max-width: 200px; ">
		<v-list :dense="dense" :nav="nav">
			<v-list-item v-for="(item, i) in items" :dense="$props['dense' + i]" :key="i">
				<v-list-item-content>
					{{ item }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-sheet>`
});

export const withLinks = () => ({
	router: router,
	props: {
		dense: {
			default: boolean('Dense', false, 'Full List')
		},
		dense0: {
			default: boolean('Dense', false, 'List Item 0')
		},
		dense1: {
			default: boolean('Dense', false, 'List Item 1')
		},
		dense2: {
			default: boolean('Dense', false, 'List Item 2')
		},
		dense3: {
			default: boolean('Dense', false, 'List Item 3')
		},
		nav: {
			default: boolean('Nav', false, 'Full List')
		}
	},
	data() {
		return {
			items: ['Item 0', 'Item 1', 'Item 2', 'Item 3']
		};
	},
	template: `
	<v-sheet style="--v-sheet-max-width: 200px; ">
		<v-list :dense="dense" :nav="nav">
			<v-list-item v-for="(item, i) in items" :dense="$props['dense' + i]" :key="i" :to="'/' + i">
				<v-list-item-content>
					{{ item }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-sheet>`
});

export const withClicks = () => ({
	props: {},
	data() {
		return {
			items: ['Item 0', 'Item 1', 'Item 2', 'Item 3'],
			clickHandler: action('onClick')
		};
	},
	template: `
	<v-sheet style="--v-sheet-max-width: 200px; ">
		<v-list>
			<v-list-item v-for="(item, i) in items" :key="i" @click="clickHandler">
				<v-list-item-content>
					{{ item }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-sheet>`
});

export const orphanListItems = () => ({
	router: router,
	props: {
		dense0: {
			default: boolean('Dense', false, 'List Item 0')
		},
		dense1: {
			default: boolean('Dense', false, 'List Item 1')
		},
		dense2: {
			default: boolean('Dense', false, 'List Item 2')
		},
		dense3: {
			default: boolean('Dense', false, 'List Item 3')
		}
	},
	data() {
		return {
			items: ['Item 0', 'Item 1', 'Item 2', 'Item 3']
		};
	},
	template: `
	<v-sheet style="--v-sheet-max-width: 200px; ">
		<v-list-item v-for="(item, i) in items" :dense="$props['dense' + i]" :key="i" :to="'/' + i">
			<v-list-item-content>
				{{item}}
			</v-list-item-content>
		</v-list-item>
	</v-sheet>`
});
