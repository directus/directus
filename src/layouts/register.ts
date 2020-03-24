import registerComponent from '@/utils/register-component/';
import layouts from './index';

layouts.forEach((layout) => {
	registerComponent('layout-' + layout.id, layout.component);
});
