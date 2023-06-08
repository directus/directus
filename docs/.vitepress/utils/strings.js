export function truncateString(str, num) {
	if (!str) return;
	if (str.length <= num) {
		return str;
	}
	return str.slice(0, num) + '...';
}
