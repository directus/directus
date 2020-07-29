import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

export default function mountComposable(cb: () => any, mountOptions?: Parameters<typeof mount>[1]) {
	return mount(
		{
			setup() {
				return cb();
			},
			render(h) {
				return h('div');
			}
		},
		{
			localVue,
			...mountOptions
		}
	);
};
