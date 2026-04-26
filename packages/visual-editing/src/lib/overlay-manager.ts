export class OverlayManager {
	private static readonly CSS_VAR_Z_INDEX = '--directus-visual-editing--overlay--z-index';
	private static readonly CSS_VAR_BORDER_SPACING = '--directus-visual-editing--rect--border-spacing';
	private static readonly CSS_VAR_BORDER_WIDTH = '--directus-visual-editing--rect--border-width';
	private static readonly CSS_VAR_BORDER_COLOR = '--directus-visual-editing--rect--border-color';
	private static readonly CSS_VAR_BORDER_RADIUS = '--directus-visual-editing--rect--border-radius';
	private static readonly CSS_VAR_HOVER_OPACITY = '--directus-visual-editing--rect-hover--opacity';
	private static readonly CSS_VAR_HIGHLIGHT_OPACITY = '--directus-visual-editing--rect-highlight--opacity';
	private static readonly CSS_VAR_ACTIONS_GAP = '--directus-visual-editing--actions--gap';
	private static readonly CSS_VAR_BUTTON_WIDTH = '--directus-visual-editing--edit-btn--width';
	private static readonly CSS_VAR_BUTTON_HEIGHT = '--directus-visual-editing--edit-btn--height';
	private static readonly CSS_VAR_BUTTON_RADIUS = '--directus-visual-editing--edit-btn--radius';
	private static readonly CSS_VAR_EDIT_BUTTON_BG_COLOR = '--directus-visual-editing--edit-btn--bg-color';
	private static readonly CSS_VAR_EDIT_BUTTON_ICON_BG_IMAGE = '--directus-visual-editing--edit-btn--icon-bg-image';
	private static readonly CSS_VAR_EDIT_BUTTON_ICON_BG_SIZE = '--directus-visual-editing--edit-btn--icon-bg-size';
	private static readonly CSS_VAR_AI_BUTTON_BG_COLOR = '--directus-visual-editing--ai-btn--bg-color';
	private static readonly CSS_VAR_AI_BUTTON_ICON_BG_IMAGE = '--directus-visual-editing--ai-btn--icon-bg-image';
	private static readonly CSS_VAR_AI_BUTTON_ICON_BG_SIZE = '--directus-visual-editing--ai-btn--icon-bg-size';

	// For icons use https://fonts.google.com/icons?icon.set=Material+Icons&icon.color=%23ffffff
	private static readonly ICON_EDIT = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="%23ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg>')`;
	private static readonly ICON_AI = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path fill="%23ffffff" d="M10 14.175L11 12l2.175-1L11 10l-1-2.175L9 10l-2.175 1L9 12l1 2.175ZM10 19l-2.5-5.5L2 11l5.5-2.5L10 3l2.5 5.5L18 11l-5.5 2.5L10 19Zm8 2l-1.25-2.75L14 17l2.75-1.25L18 13l1.25 2.75L22 17l-2.75 1.25L18 21Zm-8-10Z"/></svg>')`;

	private static readonly OVERLAY_ID = 'directus-visual-editing';
	private static readonly STYLE_ID = 'directus-visual-editing-style';

	static readonly CONTAINER_RECT_CLASS_NAME = 'directus-visual-editing-overlay';
	static readonly RECT_CLASS_NAME = 'directus-visual-editing-rect';
	static readonly RECT_HIGHLIGHT_CLASS_NAME = 'directus-visual-editing-rect-highlight';
	static readonly RECT_HIGHLIGHT_ACTIVE_CLASS_NAME = 'directus-visual-editing-rect-highlight-active';
	static readonly RECT_PARENT_HOVER_CLASS_NAME = 'directus-visual-editing-rect-parent-hover';
	static readonly RECT_HOVER_CLASS_NAME = 'directus-visual-editing-rect-hover';
	static readonly RECT_INNER_CLASS_NAME = 'directus-visual-editing-rect-inner';
	static readonly RECT_BUTTON_CLASS_NAME = 'directus-visual-editing-button';
	static readonly RECT_EDIT_BUTTON_CLASS_NAME = 'directus-visual-editing-edit-button';
	static readonly RECT_AI_BUTTON_CLASS_NAME = 'directus-visual-editing-ai-button';

	static getGlobalOverlay(): HTMLElement {
		const existingOverlay = document.getElementById(OverlayManager.OVERLAY_ID);
		if (existingOverlay) return existingOverlay;

		const globalOverlay = document.createElement('div');
		globalOverlay.id = OverlayManager.OVERLAY_ID;
		document.body.insertAdjacentElement('afterend', globalOverlay);

		return globalOverlay;
	}

	static addStyles(): void {
		const existingStyle = document.getElementById(OverlayManager.STYLE_ID);
		if (existingStyle) return;

		const style = document.createElement('style');
		style.id = OverlayManager.STYLE_ID;

		const buttonSize = 28;
		const buttonWidth = `var(${OverlayManager.CSS_VAR_BUTTON_WIDTH}, ${buttonSize}px)`;
		const buttonGap = 4;
		const editButtonBgColor = `var(${OverlayManager.CSS_VAR_EDIT_BUTTON_BG_COLOR}, #6644ff)`;
		const aiButtonBgColor = `var(${OverlayManager.CSS_VAR_AI_BUTTON_BG_COLOR}, ${editButtonBgColor})`;
		const buttonBgColorMix = '#2e3C43 25%';
		const borderSpacing = `var(${OverlayManager.CSS_VAR_BORDER_SPACING}, ${Math.round(buttonSize * 0.333)}px)`;
		const borderWidth = `var(${OverlayManager.CSS_VAR_BORDER_WIDTH}, 2px)`;

		style.appendChild(
			document.createTextNode(`
				#${OverlayManager.OVERLAY_ID} {
					display: contents;
				}
				.${OverlayManager.CONTAINER_RECT_CLASS_NAME} {
					pointer-events: none;
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					z-index: var(${OverlayManager.CSS_VAR_Z_INDEX}, 999999999);
				}
				.${OverlayManager.RECT_CLASS_NAME} {
					position: absolute;
				}
				.${OverlayManager.RECT_INNER_CLASS_NAME} {
					position: absolute;
					box-sizing: border-box;
					top: calc(-1 * ${borderSpacing});
					left: calc(-1 * ${borderSpacing});
					right: calc(-1 * ${borderSpacing});
					bottom: calc(-1 * ${borderSpacing});
					border: ${borderWidth} solid var(${OverlayManager.CSS_VAR_BORDER_COLOR}, #6644ff);
					border-radius: var(${OverlayManager.CSS_VAR_BORDER_RADIUS}, 6px);
					opacity: 0;
				}
				.${OverlayManager.RECT_CLASS_NAME}.${OverlayManager.RECT_HOVER_CLASS_NAME} .${OverlayManager.RECT_INNER_CLASS_NAME} {
					--hover-opacity: var(${OverlayManager.CSS_VAR_HOVER_OPACITY}, 0.333);
					opacity: var(--hover-opacity);
				}
				.${OverlayManager.RECT_CLASS_NAME}.${OverlayManager.RECT_PARENT_HOVER_CLASS_NAME} .${OverlayManager.RECT_INNER_CLASS_NAME} {
					opacity: calc(var(--hover-opacity) / 3);
				}
				.${OverlayManager.RECT_HIGHLIGHT_CLASS_NAME} {
					pointer-events: all;
					cursor: pointer;
				}
				.${OverlayManager.RECT_HIGHLIGHT_CLASS_NAME} .${OverlayManager.RECT_INNER_CLASS_NAME}  {
					opacity: var(${OverlayManager.CSS_VAR_HIGHLIGHT_OPACITY}, 0.333);
				}
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:visited,
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:active,
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:hover,
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:focus,
				.${OverlayManager.RECT_BUTTON_CLASS_NAME} {
					all: initial;
					pointer-events: all;
					cursor: pointer;
					position: absolute;
					z-index: 1;
					top: calc(-1 * ${borderSpacing} + ${borderWidth} / 2);
					transform: translate(-50%, -50%);
					width: ${buttonWidth};
					height: var(${OverlayManager.CSS_VAR_BUTTON_HEIGHT}, ${buttonSize}px);
					border-radius: var(${OverlayManager.CSS_VAR_BUTTON_RADIUS}, 50%);
					background-position: center;
					background-repeat: no-repeat;
					opacity: 0;
				}
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}.${OverlayManager.RECT_EDIT_BUTTON_CLASS_NAME} {
					left: calc(-1 * ${borderSpacing} + ${borderWidth} / 2);
					background-color: ${editButtonBgColor};
					background-image: var(${OverlayManager.CSS_VAR_EDIT_BUTTON_ICON_BG_IMAGE}, ${OverlayManager.ICON_EDIT});
					background-size: var(${OverlayManager.CSS_VAR_EDIT_BUTTON_ICON_BG_SIZE}, 66.6%);
				}
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}.${OverlayManager.RECT_AI_BUTTON_CLASS_NAME} {
					left: calc(-1 * ${borderSpacing} + ${borderWidth} / 2 + ${buttonWidth} + var(${OverlayManager.CSS_VAR_ACTIONS_GAP}, ${buttonGap}px));
					background-color: ${aiButtonBgColor};
					background-image: var(${OverlayManager.CSS_VAR_AI_BUTTON_ICON_BG_IMAGE}, ${OverlayManager.ICON_AI});
					background-size: var(${OverlayManager.CSS_VAR_AI_BUTTON_ICON_BG_SIZE}, 66.6%);
				}
				.${OverlayManager.RECT_CLASS_NAME}.${OverlayManager.RECT_HOVER_CLASS_NAME}:not(.${OverlayManager.RECT_PARENT_HOVER_CLASS_NAME}) .${OverlayManager.RECT_BUTTON_CLASS_NAME},
				.${OverlayManager.RECT_HIGHLIGHT_ACTIVE_CLASS_NAME} .${OverlayManager.RECT_INNER_CLASS_NAME},
				.${OverlayManager.RECT_HIGHLIGHT_CLASS_NAME}:hover .${OverlayManager.RECT_BUTTON_CLASS_NAME},
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:hover,
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}:hover ~ .${OverlayManager.RECT_INNER_CLASS_NAME},
				.${OverlayManager.RECT_HIGHLIGHT_CLASS_NAME}:hover .${OverlayManager.RECT_INNER_CLASS_NAME},
				.${OverlayManager.RECT_CLASS_NAME}:has(.${OverlayManager.RECT_BUTTON_CLASS_NAME}:hover) .${OverlayManager.RECT_BUTTON_CLASS_NAME}  {
					opacity: 1;
				}
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}.${OverlayManager.RECT_EDIT_BUTTON_CLASS_NAME}:hover {
					background-color: color-mix(in srgb, ${editButtonBgColor}, ${buttonBgColorMix});
				}
				.${OverlayManager.RECT_BUTTON_CLASS_NAME}.${OverlayManager.RECT_AI_BUTTON_CLASS_NAME}:hover {
					background-color: color-mix(in srgb, ${aiButtonBgColor}, ${buttonBgColorMix});
				}
			`),
		);

		document.head.appendChild(style);
	}
}
