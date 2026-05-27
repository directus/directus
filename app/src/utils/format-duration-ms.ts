/**
 * Format a duration in milliseconds to a human-readable string.
 * Examples: "42ms", "5s", "2m 30s"
 */
export function formatDurationMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;

	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes === 0) return `${seconds}s`;
	return `${minutes}m ${remainingSeconds}s`;
}
