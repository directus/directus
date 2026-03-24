import { useEnv } from '@directus/env';
import { useStore as useMainStore } from '../../utils/store.js';

const env = useEnv();

export function useStore<Type extends object>(uid: string, defaults?: Partial<Type>) {
	return useMainStore(`${String(env['WEBSOCKETS_COLLAB_STORE_NAMESPACE'])}:${uid}`, { defaults });
}
