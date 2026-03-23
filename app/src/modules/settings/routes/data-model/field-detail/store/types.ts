import { DeepPartial } from '@directus/types';
import { useFieldDetailStore } from './index';

export type StateUpdates = DeepPartial<ReturnType<typeof useFieldDetailStore>['$state']>;
export type State = ReturnType<typeof useFieldDetailStore>['$state'];
export type HelperFunctions = {
	getCurrent: (path: string) => any;
	hasChanged: (path: string) => boolean;
};
