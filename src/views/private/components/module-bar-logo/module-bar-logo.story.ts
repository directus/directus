import markdown from './readme.md';
import ModuleBarLogo from './module-bar-logo.vue';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import useRequestsStore from '@/stores/requests';
import useProjectsStore from '@/stores/projects';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Views / Private / Components / Module Bar Logo',
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { ModuleBarLogo },
		setup() {
			useProjectsStore({});
			useRequestsStore({});
		},
		template: `
			<module-bar-logo />
		`,
	});

export const withQueue = () =>
	defineComponent({
		components: { ModuleBarLogo },
		setup() {
			useProjectsStore({});
			const requestsStore = useRequestsStore({});
			requestsStore.state.queue = ['abc'];
		},
		template: `
		<module-bar-logo />
	`,
	});

export const withCustomLogo = () =>
	defineComponent({
		components: { ModuleBarLogo },
		setup() {
			useRequestsStore({});
			const projectsStore = useProjectsStore({});

			projectsStore.state.projects = [
				{
					key: 'my-project',
					api: {
						version: '8.5.5',
						requires2FA: false,
						database: 'mysql',
						project_name: 'Thumper',
						project_logo: {
							full_url:
								'https://demo.directus.io/uploads/thumper/originals/19acff06-4969-5c75-9cd5-dc3f27506de2.svg',
							url:
								'/uploads/thumper/originals/19acff06-4969-5c75-9cd5-dc3f27506de2.svg',
						},
						project_color: '#4CAF50',
						project_foreground: null,
						project_background: null,
						telemetry: true,
						default_locale: 'en-US',
						project_public_note: null,
					},
					server: {
						max_upload_size: 104857600,
						general: {
							php_version: '7.2.22',
							php_api: 'fpm-fcgi',
						},
					},
					authenticated: true,
				},
			];
			projectsStore.state.currentProjectKey = 'my-project';
		},
		template: `
			<module-bar-logo />	`,
	});

export const withCustomColor = () =>
	defineComponent({
		components: { ModuleBarLogo },
		setup() {
			useProjectsStore({});
			useRequestsStore({});
		},
		template: `
		<module-bar-logo style="--brand: red;" />
	`,
	});
