import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import markdown from './readme.md';
import withBackground from '../../../../../.storybook/decorators/with-background';

import { defineComponent } from '@vue/composition-api';
import HeaderBar from './header-bar.vue';
import VueRouter from 'vue-router';

export default {
	title: 'Views / Private / Components / Header Bar',
	decorators: [withKnobs, withBackground],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { HeaderBar },
		props: {
			title: {
				default: text('Title', 'Hello World'),
			},
			showSidebarToggle: {
				default: boolean('Show Sidebar Toggle', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
		},
		setup() {
			const navToggle = action('update:nav-open');
			const sidebarToggle = action('update:sidebar-open');

			return { navToggle, sidebarToggle };
		},
		template: `
			<header-bar
				:title="title"
				:nav-open="false"
				:sidebar-open="false"
				:show-sidebar-toggle="showSidebarToggle"
				:dense="dense"
				@update:nav-open="navToggle"
				@update:sidebar-open="sidebarToggle"
			/>
		`,
	});

export const withBreadcrumb = () =>
	defineComponent({
		router: new VueRouter(),
		components: { HeaderBar },
		props: {
			title: {
				default: text('Title', 'Hello World'),
			},
			showSidebarToggle: {
				default: boolean('Show Sidebar Toggle', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
		},
		setup() {
			const navToggle = action('update:nav-open');
			const sidebarToggle = action('update:sidebar-open');

			return { navToggle, sidebarToggle };
		},
		template: `
			<header-bar
				:title="title"
				:nav-open="false"
				:sidebar-open="false"
				:show-sidebar-toggle="showSidebarToggle"
				:dense="dense"
				@update:nav-open="navToggle"
				@update:sidebar-open="sidebarToggle"
			>
				<template #headline>
					<v-breadcrumb :items="[
						{
							name: 'Settings',
							to: '/settings'
						},
						{
							name: 'Collection & Fields',
							to: '/settings/fields'
						}
					]" />
				</template>
			</header-bar>
		`,
	});

export const withBackButton = () =>
	defineComponent({
		router: new VueRouter(),
		components: { HeaderBar },
		props: {
			title: {
				default: text('Title', 'Hello World'),
			},
			showSidebarToggle: {
				default: boolean('Show Sidebar Toggle', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
		},
		setup() {
			const navToggle = action('update:nav-open');
			const sidebarToggle = action('update:sidebar-open');

			return { navToggle, sidebarToggle };
		},
		template: `
			<header-bar
				:title="title"
				:nav-open="false"
				:sidebar-open="false"
				:show-sidebar-toggle="showSidebarToggle"
				:dense="dense"
				@update:nav-open="navToggle"
				@update:sidebar-open="sidebarToggle"
			>
				<template #title-outer:prepend>
					<v-button icon rounded secondary>
						<v-icon name="arrow_back" />
					</v-button>
				</template>
			</header-bar>
		`,
	});

export const slots = () => {
	const SlotLabel = defineComponent({
		template: `<span style="display: block; font-size: 10px; padding: 2px; border-radius: 2px; font-family: monospace; color: red; background-color: rgba(255, 0, 0, 0.2)"><slot /></span>`,
	});

	return defineComponent({
		components: { HeaderBar, SlotLabel },
		props: {
			title: {
				default: text('Title', 'Hello World'),
			},
			showSidebarToggle: {
				default: boolean('Show Sidebar Toggle', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
		},
		setup() {
			const navToggle = action('update:nav-open');
			const sidebarToggle = action('update:sidebar-open');

			return { navToggle, sidebarToggle };
		},
		template: `
			<header-bar
				:title="title"
				:nav-open="false"
				:sidebar-open="false"
				:show-sidebar-toggle="showSidebarToggle"
				:dense="dense"
				@update:nav-open="navToggle"
				@update:sidebar-open="sidebarToggle"
			>
				<template #title-outer:prepend>
					<slot-label>title-outer:prepend</slot-label>
				</template>
				<template #headline>
					<slot-label>breadcrumb</slot-label>
				</template>
				<template #title:prepend>
					<slot-label>title:prepend</slot-label>
				</template>
				<template #title:append>
					<slot-label>title:append</slot-label>
				</template>
				<template #title-outer:append>
					<slot-label>title-outer:append</slot-label>
				</template>
				<template #actions:prepend>
					<slot-label>actions:prepend</slot-label>
				</template>
				<template #actions>
					<slot-label>actions</slot-label>
				</template>
				<template #actions:append>
					<slot-label>actions:append</slot-label>
				</template>
			</header-bar>
		`,
	});
};

export const withActions = () =>
	defineComponent({
		components: { HeaderBar },
		props: {
			title: {
				default: text('Title', 'Hello World'),
			},
			showSidebarToggle: {
				default: boolean('Show Sidebar Toggle', false),
			},
			dense: {
				default: boolean('Dense', false),
			},
		},
		setup() {
			const navToggle = action('update:nav-open');
			const sidebarToggle = action('update:sidebar-open');

			return { navToggle, sidebarToggle };
		},
		template: `
			<header-bar
				:title="title"
				:nav-open="false"
				:sidebar-open="false"
				:show-sidebar-toggle="showSidebarToggle"
				:dense="dense"
				@update:nav-open="navToggle"
				@update:sidebar-open="sidebarToggle"
			>
				<template #actions>
					<v-button rounded icon style="--v-button-background-color: var(--success);">
						<v-icon name="add" />
					</v-button>
					<v-button rounded icon style="--v-button-background-color: var(--warning);">
						<v-icon name="delete" />
					</v-button>
					<v-button rounded icon style="--v-button-background-color: var(--danger);">
						<v-icon name="favorite" />
					</v-button>
				</template>
			</header-bar>
		`,
	});
