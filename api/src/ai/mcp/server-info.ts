import type { Implementation } from '@modelcontextprotocol/server';
import { version } from 'directus/version';
import type { MCPProject } from './types.js';

/**
 * Server identity shown by MCP clients, branded with the project's name, descriptor, URL, and icon.
 */
export function getServerInfo(project: MCPProject = {}): Implementation {
	return {
		name: 'directus',
		title: project.name || 'Directus',
		version,
		description: project.descriptor || 'Content, schema, files, and flows in this Directus project',
		websiteUrl: isHttpUrl(project.url) ? project.url : 'https://directus.com',
		// PNG, since some clients (VS Code) drop SVG icons
		...(project.icon && {
			icons: [
				{ src: `data:image/png;base64,${project.icon.toString('base64')}`, mimeType: 'image/png', sizes: ['64x64'] },
			],
		}),
	};
}

function isHttpUrl(value: string | null | undefined): value is string {
	return !!value && /^https?:\/\//i.test(value) && URL.canParse(value);
}
