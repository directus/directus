import { withKnobs, boolean, select } from '@storybook/addon-knobs';
import markdown from './readme.md';
import VMenu from './v-menu.vue';
import VButton from '@/components/v-button/';
import { VList, VListItem } from '@/components/v-list/';
import { defineComponent, ref } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';
import VCheckbox from '@/components/v-checkbox/';
import VInput from '@/components/v-input/';

export default {
	title: 'Components / Menu',
	parameters: {
		notes: markdown,
	},
	decorators: [withKnobs, withPadding],
};

export const basic = () =>
	defineComponent({
		components: { VMenu, VButton, VList, VListItem },
		props: {
			closeOnClick: {
				default: boolean('Close on Click', true),
			},
			closeOnContentClick: {
				default: boolean('Close on Content Click', false),
			},
		},
		template: `
			<div>
				<v-menu
					:close-on-click="closeOnClick"
					:close-on-content-click="closeOnContentClick"
					show-arrow
					placement="right-start"
				>
					<template #activator="{ toggle }">
						<v-button @click="toggle">Click me</v-button>
					</template>

					<v-list>
						<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
							Item {{i}}
						</v-list-item>
					</v-list>
				</v-menu>
				<portal-target name="outlet" />
			</div>
        `,
	});

export const withVModel = () =>
	defineComponent({
		components: { VMenu, VButton, VList, VListItem, VCheckbox },
		setup() {
			const value = ref(false);
			return { value };
		},
		template: `
			<div>
				<v-checkbox v-model="value" label="Enabled" />

				<v-menu v-model="value" offset-y :close-on-click="false" show-arrow placement="right-start">
					<template #activator="{ toggle }">
                        <v-button style="margin-top: 50px" @click="toggle">Click me</v-button>
					</template>

                    <v-list>
						<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
                            Item {{i}}
                        </v-list-item>
					</v-list>
				</v-menu>
				<portal-target name="outlet" />
            </div>
        `,
	});

export const positioning = () =>
	defineComponent({
		components: { VMenu, VButton, VList, VListItem, VCheckbox },
		props: {
			placement: {
				default: select(
					'Placement',
					[
						'auto',
						'auto-start',
						'auto-end',
						'top',
						'top-start',
						'top-end',
						'bottom',
						'bottom-start',
						'bottom-end',
						'right',
						'right-start',
						'right-end',
						'left',
						'left-start',
						'left-end',
					],
					'auto'
				),
			},
			showArrow: {
				default: boolean('Show arrow', true),
			},
		},
		template: `
			<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
				<v-menu
					:placement="placement"
					:show-arrow="showArrow"
				>
                    <template #activator="{ toggle }">
                        <v-icon @click="toggle" name="info" />
					</template>

                    <v-list>
						<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
                            Item {{i}}
                        </v-list-item>
                    </v-list>
				</v-menu>
				<portal-target name="outlet" />
            </div>
		`,
	});

export const withEdgeOffset = () =>
	defineComponent({
		components: { VMenu, VButton, VList, VListItem },
		props: {
			closeOnClick: {
				default: boolean('Close on Click', true),
			},
			closeOnContentClick: {
				default: boolean('Close on Content Click', false),
			},
			showArrow: {
				default: boolean('Show arrow', true),
			},
			placement: {
				default: select(
					'Placement',
					[
						'auto',
						'auto-start',
						'auto-end',
						'top',
						'top-start',
						'top-end',
						'bottom',
						'bottom-start',
						'bottom-end',
						'right',
						'right-start',
						'right-end',
						'left',
						'left-start',
						'left-end',
					],
					'auto'
				),
			},
		},
		template: `
			<div id="app" style="position: relative; height: 100%; width: 100%; overflow: scroll;">
				<div style="padding: 80vh 0 150vh;">
					<v-menu
						:close-on-click="closeOnClick"
						:close-on-content-click="closeOnContentClick"
						:placement="placement"
						:show-arrow="showArrow"
					>
						<template #activator="{ toggle }">
							<v-button style="display: block; margin: 0 auto;" @click="toggle">Click me</v-button>
						</template>

						<v-list>
							<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
								Item {{i}}
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
				<portal-target name="outlet" />
            </div>
        `,
	});

export const attached = () =>
	defineComponent({
		components: { VMenu, VInput, VList, VListItem },
		props: {
			closeOnClick: {
				default: boolean('Close on Click', true),
			},
			closeOnContentClick: {
				default: boolean('Close on Content Click', false),
			},
		},
		template: `
			<div>
				<v-menu
					:close-on-click="closeOnClick"
					:close-on-content-click="closeOnContentClick"
					attached
				>
					<template #activator="{ toggle, active }">
						<v-input placeholder="This is an input...">
							<template #append>
								<v-icon @click="toggle" name="public" :style="{
									'--v-icon-color': active ? 'var(--blue)' : 'currentColor'
								}" />
							</template>
						</v-input>
					</template>

					<v-list>
						<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
							Item {{i}}
						</v-list-item>
					</v-list>
				</v-menu>
				<portal-target name="outlet" />
			</div>
        `,
	});
