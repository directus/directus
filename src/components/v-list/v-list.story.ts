import { withKnobs, boolean, text, select } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VList from './v-list.vue';
import VListItem from './v-list-item.vue';
import withPadding from '../../../.storybook/decorators/with-padding';
import VListItemContent from './v-list-item-content.vue';
import VListItemTitle from './v-list-item-title.vue';
import VListItemSubTitle from './v-list-item-subtitle.vue';
import VListItemIcon from './v-list-item-icon.vue';
import VListGroup from './v-list-group.vue';
import VSheet from '../v-sheet';
import VCheckbox from '../v-checkbox';
import VueRouter from 'vue-router';
import markdown from './readme.md';
import { defineComponent, reactive } from '@vue/composition-api';
import withBackground from '../../../.storybook/decorators/with-background';

Vue.component('v-list', VList);
Vue.component('v-list-item', VListItem);
Vue.component('v-list-item-content', VListItemContent);
Vue.component('v-list-item-title', VListItemTitle);
Vue.component('v-list-item-subtitle', VListItemSubTitle);
Vue.component('v-list-item-icon', VListItemIcon);
Vue.component('v-checkbox', VCheckbox);
Vue.component('v-list-group', VListGroup);

Vue.component('v-sheet', VSheet);

Vue.use(VueRouter);
const router = new VueRouter();

export default {
	title: 'Components / List',
	component: VList,
	decorators: [withKnobs, withPadding, withBackground],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			dense: {
				default: boolean('Dense', false, 'Full List'),
			},
			dense0: {
				default: boolean('Dense', false, 'List Item 0'),
			},
			dense1: {
				default: boolean('Dense', false, 'List Item 1'),
			},
			dense2: {
				default: boolean('Dense', false, 'List Item 2'),
			},
			dense3: {
				default: boolean('Dense', false, 'List Item 3'),
			},
			nav: {
				default: boolean('Nav', false, 'Full List'),
			},
		},
		setup() {
			return {
				items: ['Item 0', 'Item 1', 'Item 2', 'Item 3'],
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
	</v-sheet>`,
	});

export const listGroups = () =>
	defineComponent({
		router: router,
		props: {
			multiple: {
				default: boolean('Multiple', true),
			},
			multipleGroup: {
				default: boolean('Multiple (in the nested groups)', true),
			},
		},
		setup() {
			return {
				items: [0, 1, 2, 3],
			};
		},
		template: `
			<v-sheet style="--v-sheet-max-width: 600px;">
				<v-list :multiple="multiple">
					<v-list-item>
						<v-list-item-icon>
							<v-icon name="home" />
						</v-list-item-icon>
						<v-list-item-title>Home</v-list-item-title>
					</v-list-item>
					<v-list-group :multiple="multipleGroup">
						<template v-slot:activator>
							<v-list-item-icon>
								<v-icon name="box" />
							</v-list-item-icon>
							<v-list-item-title>Collections</v-list-item-title>
						</template>

						<v-list-item>
							<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
							<v-list-item-title>Users</v-list-item-title>
						</v-list-item>
					</v-list-group>
					<v-list-group :multiple="multipleGroup">
						<template v-slot:activator>
							<v-list-item-icon>
								<v-icon name="folder" />
							</v-list-item-icon>
							<v-list-item-title>Files</v-list-item-title>
						</template>

						<v-list-group :multiple="multipleGroup">
							<template v-slot:activator>
								<v-list-item-icon>
									<v-icon name="cloud_download" />
								</v-list-item-icon>
								<v-list-item-title>Download</v-list-item-title>
							</template>

							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 1</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 2</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 3</v-list-item-title>
							</v-list-item>
						</v-list-group>

						<v-list-group :multiple="multipleGroup">
							<template v-slot:activator>
								<v-list-item-icon>
									<v-icon name="cloud_upload" />
								</v-list-item-icon>
								<v-list-item-title>Upload</v-list-item-title>
							</template>

							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 1</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 2</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
								<v-list-item-title>Section 3</v-list-item-title>
							</v-list-item>

							<v-list-group :multiple="multipleGroup">
								<template v-slot:activator>
									<v-list-item-icon>
										<v-icon name="attach_file" />
									</v-list-item-icon>
									<v-list-item-title>Sub-sub-sub section</v-list-item-title>
								</template>

								<v-list-item>
									<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
									<v-list-item-title>Section 1</v-list-item-title>
								</v-list-item>
								<v-list-item>
									<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
									<v-list-item-title>Section 2</v-list-item-title>
								</v-list-item>
								<v-list-item>
									<v-list-item-icon><v-icon name="person" /></v-list-item-icon>
									<v-list-item-title>Section 3</v-list-item-title>
								</v-list-item>
							</v-list-group>
						</v-list-group>
					</v-list-group>
				</v-list>
			</v-sheet>
		`,
	});

export const withSubtitle = () =>
	defineComponent({
		router: router,
		props: {
			dense: {
				default: boolean('Dense', false, 'Full List'),
			},
			dense0: {
				default: boolean('Dense', false, 'List Item 0'),
			},
			dense1: {
				default: boolean('Dense', false, 'List Item 1'),
			},
			dense2: {
				default: boolean('Dense', false, 'List Item 2'),
			},
			dense3: {
				default: boolean('Dense', false, 'List Item 3'),
			},
			lines0: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'List Item 0'),
			},
			lines1: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'List Item 1'),
			},
			lines2: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'List Item 2'),
			},
			lines3: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'List Item 3'),
			},
			nav: {
				default: boolean('Nav', false, 'Full List'),
			},
			dynamicSubtitle: {
				default: text('Subtitle 3', '', 'Full List'),
			},
			lines: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'Full List'),
			},
		},
		setup() {
			return {
				items: {
					0: { title: 'List Item 0', subtitle: 'This is a list item subtitle.' },
					1: {
						title: 'List Item 1',
						subtitle:
							"This is another example of a list item subtitle. But this time, it's pretty long so you can see who two-line and three-line wrapping work",
					},
					2: {
						title: 'List Item 2',
						subtitle: "This is yet another example of a list subtitle. It's of medium length.",
					},
				},
			};
		},
		template: `
	<v-sheet style="--v-sheet-max-width: 400px; ">
		<v-list :dense="dense" :nav="nav" :lines="lines">
			<v-list-item v-for="(item, i) in items" :lines="$props['lines' + i]" :dense="$props['dense' + i]" :key="i" :to="'/' + i">
				<v-list-item-content>
					<v-list-item-title>{{ item.title }}</v-list-item-title>
					<v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
				</v-list-item-content>
			</v-list-item>
			<v-list-item :dense="dense3" :lines="lines3" :key=3 :to="'/' + 3">
				<v-list-item-content>
					<v-list-item-title>List Item 3</v-list-item-title>
					<v-list-item-subtitle>{{ dynamicSubtitle }}</v-list-item-subtitle>
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-sheet>`,
	});

export const withIconsToo = () =>
	defineComponent({
		router: router,
		props: {
			dense: {
				default: boolean('Dense', false, 'Full List'),
			},
			nav: {
				default: boolean('Nav', false, 'Full List'),
			},
			subtitle: {
				default: boolean('Subtitle', false, 'Full List'),
			},
			lines: {
				default: select('Lines', { One: 1, Two: 2, Three: 3, Off: null }, null, 'Full List'),
			},
			leftIconCenter: {
				default: boolean('Left Icon Centered', false, 'Full List'),
			},
			rightIconCenter: {
				default: boolean('Right Icon Centered', true, 'Full List'),
			},
			leftIcon: {
				default: boolean('Left Icon', true, 'Full List'),
			},
			rightIcon: {
				default: boolean('Right Icon', false, 'Full List'),
			},
		},
		setup() {
			const onChange = action('change');
			return {
				onChange,
				items: reactive({
					0: {
						title: 'List Item 0',
						subtitle: 'This is a list item subtitle.',
						checked: false,
					},
					1: {
						title: 'List Item 1',
						subtitle:
							"This is another example of a list item subtitle. But this time, it's pretty long so you can see who two-line and three-line wrapping work",
						checked: false,
					},
					2: {
						title: 'List Item 2',
						subtitle: "This is yet another example of a list subtitle. It's of medium length.",
						checked: false,
					},
					3: {
						title: 'List Item 3',
						subtitle: '',
						checked: false,
					},
				}),
			};
		},
		template: `
	<v-sheet style="--v-sheet-max-width: 400px; ">
		<v-list :dense="dense" :nav="nav" :lines="lines">
			<v-list-item v-for="(item, i) in items" :key="i" :to="'/' + i">
				<v-list-item-icon v-if="leftIcon" :center="leftIconCenter">
					<v-icon name="info" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-list-item-title>{{ item.title }}</v-list-item-title>
					<v-list-item-subtitle v-if="subtitle">{{ item.subtitle }}</v-list-item-subtitle>
				</v-list-item-content>
				<v-list-item-icon v-if="rightIcon" :center="rightIconCenter">
					<v-checkbox v-model="item.checked" @change="onChange"/>
				</v-list-item-icon>
			</v-list-item>
		</v-list>
	</v-sheet>`,
	});

export const withLinks = () =>
	defineComponent({
		router: router,
		props: {
			dense: {
				default: boolean('Dense', false, 'Full List'),
			},
			dense0: {
				default: boolean('Dense', false, 'List Item 0'),
			},
			dense1: {
				default: boolean('Dense', false, 'List Item 1'),
			},
			dense2: {
				default: boolean('Dense', false, 'List Item 2'),
			},
			dense3: {
				default: boolean('Dense', false, 'List Item 3'),
			},
			nav: {
				default: boolean('Nav', false, 'Full List'),
			},
		},
		setup() {
			return {
				items: ['Item 0', 'Item 1', 'Item 2', 'Item 3'],
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
	</v-sheet>`,
	});

export const withClicks = () =>
	defineComponent({
		props: {},
		setup() {
			return {
				items: ['Item 0', 'Item 1', 'Item 2', 'Item 3'],
				clickHandler: action('onClick'),
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
	</v-sheet>`,
	});

export const orphanListItems = () =>
	defineComponent({
		router: router,
		props: {
			dense0: {
				default: boolean('Dense', false, 'List Item 0'),
			},
			dense1: {
				default: boolean('Dense', false, 'List Item 1'),
			},
			dense2: {
				default: boolean('Dense', false, 'List Item 2'),
			},
			dense3: {
				default: boolean('Dense', false, 'List Item 3'),
			},
		},
		setup() {
			return {
				items: ['Item 0', 'Item 1', 'Item 2', 'Item 3'],
			};
		},
		template: `
	<v-sheet style="--v-sheet-max-width: 200px; ">
		<v-list-item v-for="(item, i) in items" :dense="$props['dense' + i]" :key="i" :to="'/' + i">
			<v-list-item-content>
				{{item}}
			</v-list-item-content>
		</v-list-item>
	</v-sheet>`,
	});
