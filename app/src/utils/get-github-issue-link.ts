import { UsableProjectInfo } from '@/modules/settings/composables/use-project-info';
import UAParser from 'ua-parser-js';

export function getGitHubIssueLink(projectInfo: UsableProjectInfo['parsedInfo'], params?: Record<string, string>) {
	const { getBrowser } = new UAParser();
	const browser = getBrowser();

	const bugReportParams = new URLSearchParams({
		template: 'bug_report.yml',
		'node-version': projectInfo.value?.node?.version ?? '',
		'directus-version': projectInfo.value?.directus?.version ?? '',
		browser: `${browser.name ?? ''}${browser.name && browser.version ? ` (${browser.version})` : ''}`,
		deployment: import.meta.env.MODE === 'development' ? 'Development' : '',
		...params,
	});

	return `https://github.com/directus/directus/issues/new?${bugReportParams.toString()}`;
}
