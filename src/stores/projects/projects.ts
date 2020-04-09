import { createStore } from 'pinia';
import { ProjectWithKey } from './types';
import api from '@/api';

type LoadingError = null | {
	status: number;
	error: string;
};

export const useProjectsStore = createStore({
	id: 'projectsStore',
	state: () => ({
		needsInstall: false,
		error: null as LoadingError,
		projects: null as ProjectWithKey[] | null,
		currentProjectKey: null as string | null,
	}),
	getters: {
		formatted: (state) => {
			return state.projects?.map((project) => {
				return {
					key: project.key,
					authenticated: project?.authenticated || false,
					name: project?.api?.project_name || null,
					error: project?.error || null,
					foregroundImage: project?.api?.project_foreground?.full_url || null,
					backgroundImage: project?.api?.project_background?.full_url || null,
					logo: project?.api?.project_logo?.full_url || null,
					color: project?.api?.project_color || null,
					note: project?.api?.project_public_note || null,
				};
			});
		},
		currentProject: (state, getters) => {
			return (
				getters.formatted.value?.find(
					({ key }: { key: string }) => key === state.currentProjectKey
				) || null
			);
		},
	},
	actions: {
		/**
		 * Sets the current project to the one with the provided key. If the project with the key
		 * doesn't exist in the public projects, try fetching the project information. If that
		 * succeeds, we'll use the private project as the current project, and add it to the pool
		 * of available projects.
		 * Returns a boolean if the operation succeeded or not.
		 */
		async setCurrentProject(key: string): Promise<boolean> {
			const projects = this.state.projects || ([] as ProjectWithKey[]);
			const projectKeys = projects.map((project) => project.key);

			if (projectKeys.includes(key) === false) {
				try {
					const projectInfoResponse = await api.get(`/${key}/`);
					const project: ProjectWithKey = {
						key: key,
						...projectInfoResponse.data.data,
					};
					this.state.projects = [...projects, project];
				} catch {
					return false;
				}
			}

			this.state.currentProjectKey = key;
			return true;
		},

		// Even though the projects are fetched on first load, we have to refresh them to make sure
		// we have the updated server information for the current project. It also gives us a chance
		// to update the authenticated state, for smoother project switching in the private view
		async hydrate() {
			await this.getProjects();
		},

		// This is the only store that's supposed to load data on dehydration. By re-fetching the
		// projects, we make sure the login views and authenticated states will be up to date. It
		// also ensures that the potentially private server info is purged from the store.
		async dehydrate() {
			await this.getProjects();
		},

		async getProjects() {
			try {
				const projectsResponse = await api.get('/server/projects');
				const projectKeys: string[] = projectsResponse.data.data;
				const projects: ProjectWithKey[] = [];

				for (let index = 0; index < projectKeys.length; index++) {
					try {
						const projectInfoResponse = await api.get(`/${projectKeys[index]}/`);
						projects.push({
							key: projectKeys[index],
							...projectInfoResponse.data.data,
							authenticated:
								projectInfoResponse?.data?.data?.hasOwnProperty('server') || false,
						});
					} catch (error) {
						/* istanbul ignore next */
						projects.push({
							key: projectKeys[index],
							status: error.response?.status,
							error: {
								message: error.response?.data?.error?.message ?? error.message,
								code: error.response?.data?.error?.code || null,
							},
							authenticated: false,
						});
					}
				}

				this.state.projects = projects;
			} catch (error) {
				/* istanbul ignore next */
				if (error.response?.status === 503) {
					this.state.needsInstall = true;
				} else {
					this.state.error = {
						/* istanbul ignore next */
						status: error.response?.status,
						error: error.message,
					};
				}
			}
		},
	},
});
