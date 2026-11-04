/**
 * Markers the starting points leave where you put in your own flow data. They aren't `{{ }}` placeholders on purpose:
 * Directus fills a placeholder for a missing field with an empty string, so it would look filled in. Only these exact
 * strings count, so other bracketed text, like a Markdown link, is fine. Checked in the editor only, since flow data
 * could contain them too.
 */
export const PLACEHOLDER_MARKERS: string[] = ['[your content]', '[language]'];

/** The first marker left in a prompt, or null when every marker has been replaced. */
export function findPlaceholderMarker(prompt: string): string | null {
	return PLACEHOLDER_MARKERS.find((marker) => prompt.includes(marker)) ?? null;
}
