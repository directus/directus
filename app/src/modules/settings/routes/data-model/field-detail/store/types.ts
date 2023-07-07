import { useFieldDetailStore } from './index';
import type { DeepPartial } from '@directus/types';

export type StateUpdates = DeepPartial<ReturnType<typeof useFieldDetailStore>['$state']>;
export type State = ReturnType<typeof useFieldDetailStore>['$state'];
export type HelperFunctions = {
	getCurrent: (path: string) => any;
	hasChanged: (path: string) => boolean;
};
