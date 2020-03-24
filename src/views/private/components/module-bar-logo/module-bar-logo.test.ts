import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import ModuleBarLogo from './module-bar-logo.vue';
import { useRequestsStore } from '@/stores/requests';
import { useProjectsStore } from '@/stores/projects';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Views / Private / Module Bar / Logo', () => {
	it('Renders the default rabbit when we are not in a project', () => {
		const component = shallowMount(ModuleBarLogo, { localVue });
		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the default rabbit when the current project errored out', () => {
		const projectsStore = useProjectsStore({});
		projectsStore.currentProject = {
			value: {
				key: 'my-project',
				status: 500,
				error: {
					code: 400,
					message: 'Could not connect to the database',
				},
			},
		};

		const component = shallowMount(ModuleBarLogo, { localVue });

		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the default rabbit when the current project does not have a custom logo', () => {
		const projectsStore = useProjectsStore({});
		projectsStore.currentProject = {
			value: {
				key: 'my-project',
				api: {
					requires2FA: false,
					project_foreground: null,
					project_background: null,
					project_color: '#abcdef',
					project_public_note: '',
					default_locale: 'en-US',
					telemetry: false,
					project_name: 'test',
					project_logo: null,
				},
			},
		};

		const component = shallowMount(ModuleBarLogo, { localVue });

		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the custom logo if set', () => {
		const projectsStore = useProjectsStore({});
		projectsStore.currentProject = {
			value: {
				key: 'my-project',
				api: {
					requires2FA: false,
					project_foreground: null,
					project_background: null,
					project_color: '#abcdef',
					project_public_note: '',
					default_locale: 'en-US',
					telemetry: false,
					project_name: 'test',
					project_logo: {
						full_url: 'abc',
						url: 'abc',
					},
				},
			},
		};

		const component = shallowMount(ModuleBarLogo, { localVue });

		expect((component.vm as any).customLogoPath).toBe('abc');
		expect(component.find('img').attributes().src).toBe('abc');
	});

	it('Only stops running if the queue is empty', () => {
		const requestsStore = useRequestsStore({});
		requestsStore.queueHasItems = { value: false };

		let component = shallowMount(ModuleBarLogo, { localVue });
		(component.vm as any).isRunning = true;
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(false);

		requestsStore.queueHasItems = { value: true };
		component = shallowMount(ModuleBarLogo, { localVue });
		expect((component.vm as any).isRunning).toBe(true);
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(true);

		requestsStore.queueHasItems = { value: false };
		component = shallowMount(ModuleBarLogo, { localVue });
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(false);
	});
});
