import { Panel } from '@directus/shared/types';

export function applyDataToPanels(panels: Panel[], incomingData: Record<any, any> | null) {
	if (!incomingData) return panels;

	/* 
	/* panelData is for panels that only have one query.
	/* multiQueryPanelData is for panels that have more than query.
	/* Such as a multiline chart.
	*/

	const panelData: Record<string, Panel | Panel[]> = {};
	const multiQueryPanelData: Record<string, any> = {};

	const panelsWithData: Panel[] = [];

	for (const [id, data] of Object.entries(incomingData)) {
		if (id.includes('__')) {
			const split = id.split('_');
			const index = split[split.length - 1];
			const panelId = id.substring(2, 41).replaceAll('-', '_');

			if (!multiQueryPanelData[panelId]) multiQueryPanelData[panelId] = {};

			multiQueryPanelData[panelId][index] = data;
		} else {
			multiQueryPanelData[id] = data;
		}
	}

	for (const panel of panels) {
		const panelId = 'id_' + panel.id.replaceAll('-', '_');
		const currentPanelData = multiQueryPanelData[panelId];

		if (currentPanelData) {
			if (Object.keys(currentPanelData).length > 0) {
				if (!Array.isArray(panelData[panelId])) panelData[panelId] = [];

				const currentPanel = panelData[panelId] as Panel[];

				for (const value of Object.values(currentPanelData)) {
					currentPanel.push(value as Panel);
				}
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
