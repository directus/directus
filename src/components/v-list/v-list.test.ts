import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import router from '@/router';
import VList from './v-list.vue';
import VListItem from './v-list-item.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(VueRouter);
localVue.component('v-list-item', VListItem);
localVue.component('v-list', VList);

describe('List', () => {
	it('Renders the provided markup in the default slot', () => {
		const component = mount(VList, {
			localVue,
			slots: {
				default: `<v-list-item>Item Text</v-list-item>`
			}
		});

		expect(component.text()).toContain('Item Text');
	});

	it('Adds the dense class for dense lists', () => {
		const component = mount(VList, {
			localVue,
			propsData: {
				dense: true
			}
		});

		expect(component.classes()).toContain('dense');
	});

	it('Adds the nav class for nav lists', () => {
		const component = mount(VList, {
			localVue,
			propsData: {
				nav: true
			}
		});

		expect(component.classes()).toContain('nav');
	});

	it('Has the right number of list items', () => {
		const component = mount(VList, {
			localVue,
			propsData: {
				dense: false
			},
			slots: {
				default: `<v-list-item/>
                  <v-list-item/>
                  <v-list-item/>`
			}
		});

		expect(component.findAll('.v-list-item').length).toEqual(3);
	});

	it('Adds the dense class to one list-item, but not the other', () => {
		const component = mount(VList, {
			localVue,
			propsData: {
				dense: false
			},
			slots: {
				default: `<v-list-item dense/>
                  <v-list-item/>`
			}
		});

		expect(component.find('.v-list-item:first-of-type').classes()).toContain('dense');
		expect(component.find('.v-list-item:nth-of-type(2)').classes()).not.toContain('dense');
	});

	it('Item has the link class when to prop is set', () => {
		const component = mount(VListItem, {
			localVue,
			router: router,
			propsData: {
				to: '/'
			}
		});

		expect(component.classes()).toContain('link');
	});

	it('Renders as a router-link if the to prop is set', () => {
		const component = mount(VListItem, {
			localVue,
			router: router,
			propsData: {
				to: '/'
			}
		});

		expect((component.vm as any).component).toBe('router-link');
	});

	it('Has link class when onClick is set', () => {
		const onClick = jest.fn();

		const component = mount(VListItem, {
			localVue,
			listeners: {
				click: onClick
			}
		});

		expect(component.classes()).toContain('link');
	});

	it('Click event fires correctly', () => {
		const onClick = jest.fn();
		const component = mount(VListItem, {
			localVue,
			listeners: {
				click: onClick
			}
		});

		component.find('.v-list-item').trigger('click');
		expect(onClick).toHaveBeenCalled();
	});
});
