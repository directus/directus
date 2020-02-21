import { RawLocation } from 'vue-router';
import { useProjectsStore } from '@/stores/projects/';
import router from '@/router';
import api from '@/api';

/**
 * Check if the current user is authenticated to the current project
 */
export async function checkAuth() {
	const { currentProjectKey } = useProjectsStore().state;

	if (!currentProjectKey) return false;

	const response = await api.get(`/${currentProjectKey}/auth/check`);
	return response.data.data.authenticated;
}

export enum LogoutReason {
	SIGN_OUT = 'SIGN_OUT',
	ERROR_SESSION_EXPIRED = 'ERROR_SESSION_EXPIRED'
}

/**
 * Everything that should happen when someone logs out, or is logged out through an external factor
 * @param reason Why the logout occured. Defaults to LogoutReason.SIGN_OUT.
 */
export function logout(reason: LogoutReason = LogoutReason.SIGN_OUT) {
	const projectsStore = useProjectsStore();
	const { currentProjectKey } = projectsStore.state;

	// You can't logout of a project if you're not in a project
	if (currentProjectKey === null) return;

	const location: RawLocation = {
		path: `/${currentProjectKey}/login`
	};

	if (reason !== LogoutReason.SIGN_OUT) {
		location.query = {
			reason: reason
		};
	}

	router.push(location);
}
