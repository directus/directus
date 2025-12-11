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

	const hasSupportedValuesOf = typeof (Intl as any).supportedValuesOf === 'function';

	if (hasSupportedValuesOf) {
		timeZones = (Intl as any).supportedValuesOf('timeZone') as string[];
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

/**
 * Formats a date to a specific timezone
 *
 * @param date - The date to format
 * @param tz - IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC'). If not provided, uses local timezone.
 * @returns
 */
export function formatDateToTimezone(date: Date, tz?: string): Date {
	// Get date components in target timezone
	const targetFormatter = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});

	const parts = targetFormatter.formatToParts(date);
	const partsMap: Record<string, string> = {};

	for (const part of parts) {
		partsMap[part.type] = part.value;
	}

	// Create a date string in ISO format and parse it as local time
	// This creates a date that, when formatted locally, shows the target timezone values
	const year = partsMap.year!;
	const month = partsMap.month!.padStart(2, '0');
	const day = partsMap.day!.padStart(2, '0');
	const hour = partsMap.hour!.padStart(2, '0');
	const minute = partsMap.minute!.padStart(2, '0');
	const second = partsMap.second!.padStart(2, '0');

	// Parse as local time (this will be formatted by date-fns in local timezone)
	return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
}

/**
 * Gets the timezone offset for a given date in a specific timezone compared to the local timezone
 *
 * @param atDate - The date to get the local timezone offset for
 * @param tz - IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC'). If not provided, uses local timezone.
 * @returns
 */
export function getLocalTimezoneOffset(atDate: Date, tz: string): number {
	const zeroTime = new Date(atDate);
	zeroTime.setHours(0, 0, 0, 0);

	const adjustedDate = formatDateToTimezone(zeroTime, tz);
	const hours = adjustedDate.getHours();
	if (hours > 12) return hours - 24;
	return hours;
}
