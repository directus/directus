import { RawLocation } from 'vue-router';
import { useProjectsStore } from '@/stores/projects/';
import api from '@/api';
import { hydrate, dehydrate } from '@/hydrate';
import router from '@/router';

/**
 * Check if the current user is authenticated to the current project
 */
export async function checkAuth() {
	const { currentProjectKey } = useProjectsStore().state;

	if (!currentProjectKey) return false;

	const response = await api.get(`/${currentProjectKey}/auth/check`);
	return response.data.data.authenticated;
}

export type LoginCredentials = {
	email: string;
	password: string;
};

export async function login(credentials: LoginCredentials) {
	const projectsStore = useProjectsStore();
	const { currentProjectKey } = projectsStore.state;

	const { email, password } = credentials;

	await api.post(`/${currentProjectKey}/auth/authenticate`, {
		mode: 'cookie',
		email: email,
		password: password
	});

	await hydrate();
}

export enum LogoutReason {
	SIGN_OUT = 'SIGN_OUT',
	ERROR_SESSION_EXPIRED = 'ERROR_SESSION_EXPIRED'
}

export type LogoutOptions = {
	navigate?: boolean;
	reason?: LogoutReason;
};

/**
 * Everything that should happen when someone logs out, or is logged out through an external factor
 */
export async function logout(optionsRaw: LogoutOptions = {}) {
	const defaultOptions: Required<LogoutOptions> = {
		navigate: true,
		reason: LogoutReason.SIGN_OUT
	};

	const options = { ...defaultOptions, ...optionsRaw };

	const projectsStore = useProjectsStore();
	const { currentProjectKey } = projectsStore.state;

	// You can't logout of a project if you're not in a project
	if (currentProjectKey === null) return;

	await dehydrate();

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (options.reason === LogoutReason.SIGN_OUT) {
		await api.post(`/${currentProjectKey}/auth/logout`);
	}

	if (options.navigate === true) {
		const location: RawLocation = {
			path: `/${currentProjectKey}/login`,
			query: { reason: options.reason }
		};

		router.push(location);
	}
}
