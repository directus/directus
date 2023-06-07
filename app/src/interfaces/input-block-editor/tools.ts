import ChecklistTool from '@editorjs/checklist';
import CodeTool from '@editorjs/code';
import DelimiterTool from '@editorjs/delimiter';
import EmbedTool from '@editorjs/embed';
import HeaderTool from '@editorjs/header';
import InlineCodeTool from '@editorjs/inline-code';
import NestedListTool from '@editorjs/nested-list';
import ParagraphTool from '@editorjs/paragraph';
import QuoteTool from '@editorjs/quote';
import RawToolTool from '@editorjs/raw';
import TableTool from '@editorjs/table';
import UnderlineTool from '@editorjs/underline';
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune';
import ToggleBlock from 'editorjs-toggle-block';
import { AttachesTool, ImageTool } from './plugins';

export type UploaderConfig = {
	addTokenToURL: (url: string, token: string) => string;
	baseURL: string | undefined;
	setFileHandler: (handler: any) => void;
	setCurrentPreview?: (url: string) => void;
	getUploadFieldElement: () => any;
};

export default function getTools(
	uploaderConfig: UploaderConfig,
	selection: Array<string>,
	haveFilesAccess: boolean
): Record<string, object> {
	const tools: Record<string, any> = {};
	const fileRequiresTools = ['attaches', 'image'];

	const defaults: Record<string, any> = {
		header: {
			class: HeaderTool,
			inlineToolbar: true,
		},
		list: {
			class: NestedListTool,
			inlineToolbar: false,
		},
		nestedlist: {
			class: NestedListTool,
			inlineToolbar: true,
		},
		embed: {
			class: EmbedTool,
			inlineToolbar: true,
		},
		paragraph: {
			class: ParagraphTool,
			inlineToolbar: true,
		},
		code: {
			class: CodeTool,
		},
		underline: {
			class: UnderlineTool,
		},
		table: {
			class: TableTool,
			inlineToolbar: true,
		},
		quote: {
			class: QuoteTool,
			inlineToolbar: true,
		},
		inlinecode: {
			class: InlineCodeTool,
		},
		delimiter: {
			class: DelimiterTool,
		},
		raw: {
			class: RawToolTool,
		},
		checklist: {
			class: ChecklistTool,
			inlineToolbar: true,
		},
		image: {
			class: ImageTool,
			config: {
				uploader: uploaderConfig,
			},
		},
		attaches: {
			class: AttachesTool,
			config: {
				uploader: uploaderConfig,
			},
		},
		toggle: {
			class: ToggleBlock,
			inlineToolbar: true,
		},
		alignment: {
			class: AlignmentTuneTool,
		},
	};

	for (const toolName of selection) {
		if (!haveFilesAccess && fileRequiresTools.includes(toolName)) continue;

		if (toolName in defaults) {
			tools[toolName] = defaults[toolName];
		}
	}

	// Add alignment to all tools that support it if it's enabled.
	// editor.js tools means we need to already declare alignment in the tools object before we can assign it to other tools.
	if ('alignment' in tools) {
		if ('paragraph' in tools) {
			tools['paragraph'].tunes = ['alignment'];
		}

		if ('header' in tools) {
			tools['header'].tunes = ['alignment'];
		}

		if ('quote' in tools) {
			tools['quote'].tunes = ['alignment'];
		}
	}

	return tools;
}
