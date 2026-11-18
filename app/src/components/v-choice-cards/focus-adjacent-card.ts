const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/** Arrow keys move focus between cards without selecting, while every card stays its own Tab stop. */
export function focusAdjacentCard(event: KeyboardEvent): void {
	const card = event.target as HTMLElement;
	const group = event.currentTarget as HTMLElement;
	let step = STEPS[event.key];

	if (!step || !card.classList.contains('choice-card')) return;

	if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && getComputedStyle(group).direction === 'rtl') {
		step = -step;
	}

	const cards = Array.from(group.querySelectorAll<HTMLElement>('.choice-card:not(:disabled)'));
	const index = cards.indexOf(card);
	if (index === -1) return;

	event.preventDefault();
	cards[(index + step + cards.length) % cards.length]!.focus();
}
