type TimezoneOption = {
	text: string;
	value: string;
};

type TimezoneNode = {
	text: string;
	children?: TimezoneOption[];
};

export function getTimezoneOptions(): TimezoneNode[] {
	// 1. Get the list of time zones from Intl (where supported)
	let timeZones: string[] = [];

	const hasSupportedValuesOf = 'supportedValuesOf' in Intl;

	if (hasSupportedValuesOf) {
		timeZones = (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone');
	} else {
		// Fallback: minimal set
		timeZones = [
			'UTC',
			'Europe/Oslo',
			'Europe/London',
			'Europe/Paris',
			'America/New_York',
			'America/Los_Angeles',
			'Asia/Tokyo',
			'Asia/Shanghai',
			'Asia/Kolkata',
			'Australia/Sydney',
		];
	}

	// 2. Build { text, value } options
	// Note: Intl.DisplayNames doesn't support type: "timeZone", so we format manually
	const options: Record<string, TimezoneNode> = {};

	for (const tz of timeZones) {
		const [prefix, text] = tz.split('/') as [string, string];

		options[prefix] ??= {
			text: prefix,
			children: [],
		};

		options[prefix].children!.push({
			text,
			value: tz,
		});
	}

	return Object.values(options);
}
