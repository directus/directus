import { Ref } from '@vue/composition-api';

type Alteration = 'bold' | 'italic' | 'strikethrough';

type AlterationFunctions = Record<Alteration, (selections: string[]) => string[]>;

export function useEdit(codemirror: Ref<CodeMirror.EditorFromTextArea | null>) {
	const alterations: AlterationFunctions = {
		bold(selections) {
			return selections.map((selection) => {
				if (selection.startsWith('**') && selection.endsWith('**')) {
					return selection.substring(2, selection.length - 2);
				} else {
					return `**${selection}**`;
				}
			});
		},
		italic(selections) {
			return selections.map((selection) => {
				if (selection.startsWith('*') && selection.endsWith('*')) {
					return selection.substring(1, selection.length - 1);
				} else {
					return `*${selection}*`;
				}
			});
		},
		strikethrough(selections) {
			return selections.map((selection) => {
				if (selection.startsWith('~~') && selection.endsWith('~~')) {
					return selection.substring(2, selection.length - 2);
				} else {
					return `~~${selection}~~`;
				}
			});
		}
	}

	return { edit };

	function edit(type: Alteration) {
		if (codemirror.value) {
			const selections = codemirror.value.getSelections();
			codemirror.value.replaceSelection(alterations[type](selections));
		}
	}
}
