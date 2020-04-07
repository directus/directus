import Vue from 'vue';

import VAvatar from './v-avatar/';
import VButton from './v-button/';
import VBreadcrumb from './v-breadcrumb';
import VCard, { VCardActions, VCardTitle, VCardSubtitle, VCardText } from './v-card';
import VCheckbox from './v-checkbox/';
import VChip from './v-chip/';
import VDialog from './v-dialog';
import VDivider from './v-divider';
import VFancySelect from './v-fancy-select';
import VForm from './v-form';
import VHover from './v-hover/';
import VModal from './v-modal/';
import VIcon from './v-icon/';
import VInfo from './v-info/';
import VInput from './v-input/';
import VItemGroup, { VItem } from './v-item-group';
import VList, {
	VListItem,
	VListItemContent,
	VListItemIcon,
	VListItemHint,
	VListItemSubtitle,
	VListItemTitle,
	VListGroup,
} from './v-list/';
import VMenu from './v-menu/';
import VNotice from './v-notice/';
import VOverlay from './v-overlay/';
import VPagination from './v-pagination/';
import VProgressLinear from './v-progress/linear/';
import VProgressCircular from './v-progress/circular/';
import VRadio from './v-radio/';
import VSelect from './v-select/';
import VSheet from './v-sheet/';
import VSkeletonLoader from './v-skeleton-loader/';
import VSlider from './v-slider/';
import VSwitch from './v-switch/';
import VTable from './v-table/';
import VTabs, { VTab, VTabsItems, VTabItem } from './v-tabs/';
import VTextarea from './v-textarea';

Vue.component('v-avatar', VAvatar);
Vue.component('v-button', VButton);
Vue.component('v-breadcrumb', VBreadcrumb);
Vue.component('v-card', VCard);
Vue.component('v-card-title', VCardTitle);
Vue.component('v-card-subtitle', VCardSubtitle);
Vue.component('v-card-text', VCardText);
Vue.component('v-card-actions', VCardActions);
Vue.component('v-checkbox', VCheckbox);
Vue.component('v-chip', VChip);
Vue.component('v-dialog', VDialog);
Vue.component('v-divider', VDivider);
Vue.component('v-fancy-select', VFancySelect);
Vue.component('v-form', VForm);
Vue.component('v-hover', VHover);
Vue.component('v-modal', VModal);
Vue.component('v-icon', VIcon);
Vue.component('v-info', VInfo);
Vue.component('v-input', VInput);
Vue.component('v-item-group', VItemGroup);
Vue.component('v-item', VItem);
Vue.component('v-list', VList);
Vue.component('v-list-item', VListItem);
Vue.component('v-list-item-content', VListItemContent);
Vue.component('v-list-item-icon', VListItemIcon);
Vue.component('v-list-item-hint', VListItemHint);
Vue.component('v-list-item-subtitle', VListItemSubtitle);
Vue.component('v-list-item-title', VListItemTitle);
Vue.component('v-list-group', VListGroup);
Vue.component('v-menu', VMenu);
Vue.component('v-notice', VNotice);
Vue.component('v-overlay', VOverlay);
Vue.component('v-pagination', VPagination);
Vue.component('v-progress-linear', VProgressLinear);
Vue.component('v-progress-circular', VProgressCircular);
Vue.component('v-radio', VRadio);
Vue.component('v-select', VSelect);
Vue.component('v-sheet', VSheet);
Vue.component('v-skeleton-loader', VSkeletonLoader);
Vue.component('v-slider', VSlider);
Vue.component('v-switch', VSwitch);
Vue.component('v-table', VTable);
Vue.component('v-tabs', VTabs);
Vue.component('v-tab', VTab);
Vue.component('v-tabs-items', VTabsItems);
Vue.component('v-tab-item', VTabItem);
Vue.component('v-textarea', VTextarea);

import DrawerDetail from '@/views/private/components/drawer-detail/';

Vue.component('drawer-detail', DrawerDetail);

import TransitionExpand from './transition/expand';

Vue.component('transition-expand', TransitionExpand);
