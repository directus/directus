import { Panel } from '@directus/shared/types';

export function applyDataToPanels(panels: Panel[], incomingData: Record<string, any> | null) {
	if (!incomingData) return panels;

	const panelData: Record<string, Panel | Panel[]> = {};
	const justData: Record<string, any> = {};

	const panelsWithData: Panel[] = [];

	for (const [id, data] of Object.entries(incomingData)) {
		if (id.includes('__')) {
			const split = id.split('_');
			const index = split[split.length - 1];
			const panelId = id.substring(2, 41).replaceAll('-', '_');

			if (!justData[panelId]) justData[panelId] = {};

			justData[panelId][index] = data;
		} else {
			justData[id] = data;
		}
	}

	for (const panel of panels) {
		const panelId = 'id_' + panel.id.replaceAll('-', '_');
		const currentPanelData = justData[panelId];

		if (currentPanelData) {
			if (Object.keys(currentPanelData).length > 0) {
				panelData[panelId] = Object.values(currentPanelData);
			} else {
				panelData[panelId] = currentPanelData;
			}
		}

		if (panelData[panelId]) {
			panel.data = panelData[panelId];
		}
		panelsWithData.push(panel);
	}

	return panelsWithData;
}
