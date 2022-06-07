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
			const panelId = id.split('__')[0];
			const index = id.split('__')[1];

			if (!multiQueryPanelData[panelId]) multiQueryPanelData[panelId] = {};

			multiQueryPanelData[panelId][index] = data;
		} else {
			multiQueryPanelData[id] = data;
		}
	}

	for (const panel of panels) {
		const panelId = 'id_' + panel.id.replaceAll('-', '_');

		if (multiQueryPanelData[panelId]) {
			if (Object.keys(multiQueryPanelData[panelId]).length > 0) {
				panelData[panelId] = [];

				for (const value of Object.values(multiQueryPanelData[panelId])) {
					panelData[panelId].push(value);
				}
			} else {
				panelData[panelId] = multiQueryPanelData[panelId];
			}
		}

		if (incomingData[panelId]) {
			if (!Array.isArray(incomingData[panelId])) {
				panelData[panelId] = incomingData[panelId];
			}
		}

		if (panelData[panelId]) {
			panel.data = panelData[panelId];
		}
		panelsWithData.push(panel);
	}

	return panelsWithData;
}
