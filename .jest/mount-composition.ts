import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

export default function mountComposition(cb: () => any) {
	return mount(
		{
			setup() {
				return cb();
			},
			render(h) {
				return h('div');
			}
		},
		{ localVue }
	);
};
