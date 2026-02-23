import type { AbstractServiceOptions } from '@directus/types';
import { ItemsService } from './items.js';

export interface DeploymentRun {
	id: string;
	project: string;
	external_id: string;
	target: string;
	status: string | null;
	url: string | null;
	started_at: string | null;
	completed_at: string | null;
	date_created: string;
	user_created: string;
}

export class DeploymentRunsService extends ItemsService<DeploymentRun> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployment_runs', options);
	}

	/**
	 * Get run stats for a project within a date range
	 */
	async getStats(
		projectId: string,
		sinceDate: string,
	): Promise<{ total_deployments: number; average_build_time: number | null }> {
		const dateFilter = {
			_and: [{ project: { _eq: projectId } }, { date_created: { _gte: sinceDate } }],
		};

		const [countResult, completedRuns] = await Promise.all([
			this.readByQuery({
				filter: dateFilter,
				aggregate: { count: ['*'] },
			}) as Promise<any[]>,
			this.readByQuery({
				filter: {
					_and: [
						{ project: { _eq: projectId } },
						{ date_created: { _gte: sinceDate } },
						{ started_at: { _nnull: true } },
						{ completed_at: { _nnull: true } },
					],
				},
				fields: ['started_at', 'completed_at'],
				limit: -1,
			}),
		]);

		let averageBuildTime: number | null = null;

		if (completedRuns.length > 0) {
			const durations = completedRuns.map(
				(r) => new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime(),
			);

			averageBuildTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
		}

		return {
			total_deployments: Number(countResult[0]?.['count'] ?? 0),
			average_build_time: averageBuildTime,
		};
	}
}
