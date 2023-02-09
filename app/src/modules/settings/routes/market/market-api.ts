import { getRootPath } from '@/utils/get-root-path';
import axios from 'axios';

const baseURL = getRootPath() + 'market/';

export const marketApi = axios.create({
	baseURL,
	headers: {
		'Cache-Control': 'no-store',
	},
});
