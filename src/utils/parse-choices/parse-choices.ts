export default function parseChoices(choices: string) {
	return choices
		.trim()
		.split('\n')
		.filter((r) => r.length !== 0)
		.map((row) => {
			const parts = row.split('::').map((part) => part.trim());

			if (parts.length > 1) {
				return {
					value: parts[0],
					text: parts[1],
				};
			}

			return {
				value: parts[0],
				text: parts[0],
			};
		});
}
