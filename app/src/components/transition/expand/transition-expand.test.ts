import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI, { defineComponent, ref } from '@vue/composition-api';
import TransitionExpand from './transition-expand.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

localVue.component('transition-expand', TransitionExpand);

const ExpandTestUtil = defineComponent({
	setup() {
		const active = ref<boolean>(false);
		const toggle = () => (active.value = !active.value);
		return { active, toggle };
	},
	template: `
		<div>
			<slot v-bind="{ active, toggle }" />
		</div>
	`,
});

describe('Expand Transition', () => {
	it('Renders the provided markup in the default slot', async () => {
		const component = mount(ExpandTestUtil, {
			localVue,
			scopedSlots: {
				default: `
                        <div slot-scope="foo">
                            <button @click="foo.toggle"/>
                            <transition-expand>
                                <div v-show="foo.active" class="test"> Content </div>
                            </transition-expand>
                        </div>
                    `,
			},
		});

		expect(component.find('.test').isVisible()).toBe(false);
		component.find('button').trigger('click');
		await component.vm.$nextTick();
		expect(component.find('.test').isVisible()).toBe(true);
	});
});
