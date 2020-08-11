import { registerComponent } from '@/utils';
import layouts from './index';

layouts.forEach((layout) => {
	registerComponent('layout-' + layout.id, layout.component);
});
