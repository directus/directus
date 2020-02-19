import { Project } from '@/types/project';

export interface ProjectWithKey extends Project {
	key: string;
}

export interface ProjectError {
	key: string;
	status: number;
	error: {
		code: number;
		message: string;
	} | null;
}

export type Projects = (ProjectWithKey | ProjectError)[];
