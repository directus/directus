// Define the time units
const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const daysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const units = {
	year: 24 * 60 * 60 * 1000 * 365,
	month: (24 * 60 * 60 * 1000 * 365) / 12,
	week: 24 * 60 * 60 * 1000 * 7,
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	second: 1000,
};

// You probably want to change this to your own locale
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// Get relative time without libraries like moment.js or dayjs (ie '2 days ago')
function getRelativeTime(d1, d2 = new Date()) {
	// Check if d1 is a date object
	if (!(d1 instanceof Date)) d1 = new Date(d1);

	const elapsed = d1 - d2;
	// "Math.abs" accounts for both "past" & "future" scenarios
	for (const u in units)
		if (Math.abs(elapsed) > units[u] || u === 'second') return rtf.format(Math.round(elapsed / units[u]), u);
}

// Format date to be more readable
function getFriendlyDate(dateString) {
	const d = new Date(dateString);
	const year = d.getFullYear();
	const date = d.getDate();
	const dateSuffix = (date) => {
		if (date > 3 && d < 21) return 'th';
		switch (date % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	};
	const monthIndex = d.getMonth();
	const monthName = months[monthIndex];
	const dayName = daysAbbr[d.getDay()];
	const formatted = `${dayName}, ${monthName} ${date}${dateSuffix()}, ${year}`;
	return formatted;
}

function getMonth(dateString) {
	const d = new Date(dateString);
	const monthIndex = d.getMonth();
	return monthsAbbr[monthIndex];
}

function getDate(dateString) {
	const d = new Date(dateString);
	return d.getDate();
}

function getDay(dateString) {
	const d = new Date(dateString);
	const dayIndex = d.getDay();
	return days[dayIndex];
}

export { getRelativeTime, getFriendlyDate, getMonth, getDate, getDay };
