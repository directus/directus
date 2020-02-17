import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import ModuleBarLogo from './_module-bar-logo.vue';
import { useProjectsStore } from '@/stores/projects';
import { useRequestsStore } from '@/stores/requests';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Views / Private / Module Bar / Logo', () => {
	let component: Wrapper<Vue>;
	const projectsStore = useProjectsStore();
	const requestsStore = useRequestsStore();

	beforeEach(() => {
		component = mount(ModuleBarLogo, { localVue });
		projectsStore.reset();
		requestsStore.reset();
	});

	it('Renders the default rabbit when were not in a project', () => {
		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the default rabbit when the current project errored out', () => {
		projectsStore.state.projects = [
			{
				key: 'my-project',
				status: 500,
				error: {
					code: 400,
					message: 'Could not connect to the database'
				}
			}
		];
		projectsStore.state.currentProjectKey = 'my-project';
		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the default rabbit when the current project does not have a custom logo', () => {
		projectsStore.state.projects = [
			{
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
					project_logo: null
				}
			}
		];
		projectsStore.state.currentProjectKey = 'my-project';
		expect((component.vm as any).customLogoPath).toBe(null);
	});

	it('Renders the custom logo if set', async () => {
		projectsStore.state.projects = [
			{
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
						url: 'abc'
					}
				}
			}
		];
		projectsStore.state.currentProjectKey = 'my-project';
		await component.vm.$nextTick();
		expect((component.vm as any).customLogoPath).toBe('abc');
		expect(component.find('img').attributes().src).toBe('abc');
	});

	it('Only stops running if the queue is empty', async () => {
		requestsStore.state.queue = [];
		await component.vm.$nextTick();
		(component.vm as any).isRunning = true;
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(false);

		requestsStore.state.queue = ['abc'];
		await component.vm.$nextTick();
		expect((component.vm as any).isRunning).toBe(true);
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(true);
		requestsStore.state.queue = [];
		await component.vm.$nextTick();
		(component.vm as any).stopRunningIfQueueIsEmpty();
		expect((component.vm as any).isRunning).toBe(false);
	});
});
