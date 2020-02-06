import axios from 'axios';

const api = axios.create({
	baseURL: getRootPath()
});

export function getRootPath(): string {
	const path = window.location.pathname;
	const parts = path.split('/');
	const adminIndex = parts.indexOf('admin');
	const rootPath = parts.slice(0, adminIndex).join('/') + '/';
	return rootPath;
}

export default api;
