import { InvalidCredentialsError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import type {
  Credentials,
  Deployment,
  Details,
  LatestDeployment,
  Options,
  Project,
  Status,
  TriggerResult,
} from '../../types/deployment.js';
import { DeploymentDriver } from '../deployment.js';

const VERCEL_API_URL = 'https://api.vercel.com';

export interface VercelCredentials extends Credentials {
  access_token: string;
  team_id?: string;
}

export class VercelDriver extends DeploymentDriver<VercelCredentials> {
  constructor(credentials: VercelCredentials, options: Options = {}) {
    super(credentials, options);
  }

  /**
   * Make authenticated request to Vercel API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(endpoint, VERCEL_API_URL);

    if (this.credentials.team_id) {
      url.searchParams.set('teamId', this.credentials.team_id);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.credentials.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.error?.message || `Vercel API error: ${response.status}`;

      if (response.status === 401 || response.status === 403) {
        throw new InvalidCredentialsError();
      }

      throw new ServiceUnavailableError({ service: 'vercel', reason: message });
    }

    return response.json();
  }

  /**
   * Map Vercel status to our generic status
   */
  private mapStatus(vercelStatus: string): Status {
    const statusMap: Record<string, Status> = {
      QUEUED: 'queued',
      BUILDING: 'building',
      READY: 'ready',
      ERROR: 'error',
      CANCELED: 'canceled',
    };

    return statusMap[vercelStatus] || 'queued';
  }

  async testConnection(): Promise<void> {
    // Test by fetching authenticated user info
    await this.request('/v2/user');
  }

  async listProjects(): Promise<Project[]> {
    const response = await this.request<{ projects: any[] }>('/v9/projects');

    // Simple mapping for config/selection - no need for url/latestDeployment
    return response.projects.map((project) => ({
      id: project.id,
      name: project.name,
      deployable: Boolean(project.link?.type),
      framework: project.framework,
    }));
  }

  async getProject(projectId: string): Promise<Project> {
    const project = await this.request<any>(`/v9/projects/${encodeURIComponent(projectId)}`);

    const result: Project = {
      id: project.id,
      name: project.name,
      deployable: Boolean(project.link?.type),
      framework: project.framework,
    };

    const production = project.targets?.production;

    if (production?.alias?.[0]) {
      result.url = `https://${production.alias[0]}`;
    }

    // Latest deployment info from detail endpoint
    if (production?.readyState) {
      const latestDeployment: LatestDeployment = {
        status: this.mapStatus(production.readyState),
        createdAt: new Date(production.createdAt),
      };

      if (production.readyAt) {
        latestDeployment.readyAt = new Date(production.readyAt);
      }

      result.latestDeployment = latestDeployment;
    }

    if (project.createdAt) {
      result.createdAt = new Date(project.createdAt);
    }

    if (project.updatedAt) {
      result.updatedAt = new Date(project.updatedAt);
    }

    return result;
  }

  async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
    const url = `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=${limit}`;
    const response = await this.request<{ deployments: any[] }>(url);

    return response.deployments.map((deployment) => {
      const result: Deployment = {
        id: deployment.uid,
        projectId: deployment.projectId ?? projectId,
        status: this.mapStatus(deployment.state ?? 'QUEUED'),
        createdAt: new Date(deployment.createdAt ?? Date.now()),
      };

      if (deployment.url) {
        result.url = `https://${deployment.url}`;
      }

      if (deployment.ready) {
        result.readyAt = new Date(deployment.ready);
      }

      if (deployment.meta) {
        result.meta = deployment.meta as Record<string, any>;
      }

      return result;
    });
  }

  async getDeployment(deploymentId: string): Promise<Details> {
    const deployment = await this.request<any>(`/v13/deployments/${encodeURIComponent(deploymentId)}`);

    const result: Details = {
      id: deployment.id,
      projectId: deployment.projectId ?? '',
      status: this.mapStatus(deployment.status ?? 'QUEUED'),
      createdAt: new Date(deployment.createdAt),
    };

    if (deployment.url) {
      result.url = `https://${deployment.url}`;
    }

    if (deployment.ready) {
      result.readyAt = new Date(deployment.ready);
    }

    if (deployment.meta) {
      result.meta = deployment.meta as Record<string, any>;
    }

    return result;
  }

  async triggerDeployment(projectId: string, target?: string, clearCache?: boolean): Promise<TriggerResult> {
    // Get full project details
    const projectDetails = await this.request<any>(`/v9/projects/${encodeURIComponent(projectId)}`);

    // Check if project has Git source configured
    if (!projectDetails.link?.type) {
      throw new InvalidPayloadError({
        reason: `Project "${projectDetails.name}" has no Git source configured and cannot trigger deployments`,
      });
    }

    const body: Record<string, any> = {
      name: projectDetails.name,
      target: target === 'production' ? 'production' : 'preview',
      project: projectId,
      forceNew: clearCache ? 1 : 0, // Vercel uses forceNew to skip build cache
    };

    // Add git source based on provider type
    if (projectDetails.link.type === 'github') {
      body['gitSource'] = {
        type: 'github',
        ref: target || projectDetails.link.productionBranch || 'main',
        repoId: Number(projectDetails.link.repoId),
      };
    } else if (projectDetails.link.type === 'gitlab') {
      body['gitSource'] = {
        type: 'gitlab',
        ref: target || projectDetails.link.productionBranch || 'main',
        projectId: Number(projectDetails.link.repoId),
      };
    } else if (projectDetails.link.type === 'bitbucket') {
      body['gitSource'] = {
        type: 'bitbucket',
        ref: target || projectDetails.link.productionBranch || 'main',
        workspaceUuid: projectDetails.link.org,
        repoUuid: projectDetails.link.repo,
      };
    }

    const response = await this.request<any>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const triggerResult: TriggerResult = {
      deploymentId: response.id,
      status: this.mapStatus(response.status ?? 'QUEUED'),
    };

    if (response.url) {
      triggerResult.url = `https://${response.url}`;
    }

    return triggerResult;
  }

  override async cancelDeployment(deploymentId: string): Promise<void> {
    await this.request(`/v12/deployments/${encodeURIComponent(deploymentId)}/cancel`, {
      method: 'PATCH',
    });
  }
}