import type { Schema } from '../../shared/types/schema';
import {
	createDirectus,
	readItems,
	rest,
	createItem,
	staticToken,
	uploadFiles,
	readMe,
	withToken,
	type QueryFilter,
	readUser,
} from '@directus/sdk';

const {
	public: { directusUrl },
	directusServerToken,
} = useRuntimeConfig();

const directusServer = createDirectus<Schema>(directusUrl as string)
	.with(rest())
	.with(staticToken(directusServerToken as string));

export { directusServer, readItems, readMe, createItem, withToken, uploadFiles, readUser };
export type { QueryFilter };
