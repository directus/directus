import { createStore } from 'pinia';
import { Project } from '@/types/project';
import api from '@/api';

interface ProjectWithKey extends Project {
	key: string;
}

interface ProjectError {
	key: string;
	status: number;
	error: {
		code: number;
		message: string;
	} | null;
}

type Projects = (ProjectWithKey | ProjectError)[];

export const useProjectsStore = createStore({
	id: 'projects',
	state: () => ({
		needsInstall: false,
		error: null as any,
		projects: [] as Projects
	}),
	actions: {
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
						projects.push({
							key: projectKeys[index],
							status: error.response.status,
							error: error.response.data?.error?.message || error.message
						});
					}
				}

				this.state.projects = projects;
			} catch (error) {
				if (error.response.status === 503) {
					this.state.needsInstall = true;
				} else {
					this.state.error = {
						status: error.response.status,
						error: error.message
					};
				}
			}
		}
	}
});
