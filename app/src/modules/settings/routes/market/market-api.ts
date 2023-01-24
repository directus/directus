import { getRootPath } from '@/utils/get-root-path';
import axios from 'axios';

const baseURL = import.meta.env.DEV ? getRootPath() + 'market/' : 'https://market.directus.app/';

export const marketApi = axios.create({
	baseURL,
	headers: {
		'Cache-Control': 'no-store',
	},
});
