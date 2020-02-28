import { createStore } from 'pinia';
import { Projects, ProjectWithKey, ProjectError } from './types';
import api from '@/api';

export const useProjectsStore = createStore({
	id: 'projects',
	state: () => ({
		needsInstall: false,
		error: null as any,
		projects: [] as Projects,
		currentProjectKey: null as string | null
	}),
	getters: {
		currentProject: (state): ProjectWithKey | ProjectError | null => {
			return state.projects.find(({ key }) => key === state.currentProjectKey) || null;
		}
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
			const projectKeys = this.state.projects.map(project => project.key);

			if (projectKeys.includes(key) === false) {
				try {
					const projectInfoResponse = await api.get(`/${key}/`);
					const project: ProjectWithKey = {
						key: key,
						...projectInfoResponse.data.data
					};
					this.state.projects = [...this.state.projects, project];
				} catch {
					return false;
				}
			}

			this.state.currentProjectKey = key;
			return true;
		},

		async getProjects() {
			try {
				const projectsResponse = await api.get('/server/projects');
				const projectKeys: string[] = projectsResponse.data.data;
				let projects: Projects = [];

				for (let index = 0; index < projectKeys.length; index++) {
					try {
						const projectInfoResponse = await api.get(`/${projectKeys[index]}/`);
						projects.push({
							key: projectKeys[index],
							...projectInfoResponse.data.data
						});
					} catch (error) {
						/* istanbul ignore next */
						projects.push({
							key: projectKeys[index],
							status: error.response?.status,
							error: error.response?.data?.error?.message ?? error.message
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
						error: error.message
					};
				}
			}
		}
	}
});
