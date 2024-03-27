import { Map, Point } from 'maplibre-gl';

export class ButtonControl {
	active: boolean;
	element: HTMLElement;
	groupElement?: HTMLElement;
	constructor(
		private className: string,
		private callback: (...args: any) => any,
	) {
		this.element = document.createElement('button');
		this.element.className = this.className;
		this.element.onpointerdown = callback;
		this.active = false;
	}

	click(...args: any[]): void {
		this.callback(...args);
	}

	activate(yes: boolean): void {
		this.element.classList[yes ? 'add' : 'remove']('active');
		this.active = yes;
	}

	show(yes: boolean): void {
		this.element.classList[yes ? 'remove' : 'add']('hidden');
	}

	onAdd(): HTMLElement {
		this.groupElement = document.createElement('div');
		this.groupElement.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.groupElement.appendChild(this.element);
		return this.groupElement;
	}

	onRemove(): void {
		this.element.remove();
		this.groupElement?.remove();
	}
}

type BoxSelectControlOptions = {
	groupElementClass?: string;
	boxElementClass?: string;
	selectButtonClass?: string;
	layers: string[];
};

export class BoxSelectControl {
	groupElement: HTMLElement;
	boxElement: HTMLElement;

	selectButton: ButtonControl;

	map?: Map & { fire: (event: string, data?: any) => void };
	layers: string[];

	selecting = false;
	shiftPressed = false;
	startPos: Point | undefined;
	lastPos: Point | undefined;

	onKeyDownHandler: (event: KeyboardEvent) => any;
	onKeyUpHandler: (event: KeyboardEvent) => any;
	onMouseDownHandler: (event: MouseEvent) => any;
	onMouseMoveHandler: (event: MouseEvent) => any;
	onMouseUpHandler: (event: MouseEvent) => any;

	constructor(options: BoxSelectControlOptions) {
		this.layers = options?.layers ?? [];
		this.boxElement = document.createElement('div');
		this.boxElement.className = options?.boxElementClass ?? 'selection-box';
		this.groupElement = document.createElement('div');
		this.groupElement.className = options?.groupElementClass ?? 'mapboxgl-ctrl mapboxgl-ctrl-group';

		this.selectButton = new ButtonControl(options?.selectButtonClass ?? 'ctrl-select', () => {
			this.activate(!this.shiftPressed);
		});

		this.groupElement.appendChild(this.selectButton.element);

		this.onKeyDownHandler = this.onKeyDown.bind(this);
		this.onKeyUpHandler = this.onKeyUp.bind(this);
		this.onMouseDownHandler = this.onMouseDown.bind(this);
		this.onMouseMoveHandler = this.onMouseMove.bind(this);
		this.onMouseUpHandler = this.onMouseUp.bind(this);
	}

	onAdd(map: Map): HTMLElement {
		this.map = map as any;
		this.map!.boxZoom.disable();
		this.map!.getContainer().appendChild(this.boxElement);
		this.map!.getContainer().addEventListener('pointerdown', this.onMouseDownHandler, true);
		document.addEventListener('keydown', this.onKeyDownHandler);
		document.addEventListener('keyup', this.onKeyUpHandler);
		return this.groupElement;
	}

	onRemove(): void {
		this.map!.boxZoom.enable();
		this.boxElement.remove();
		this.groupElement.remove();
		this.map!.getContainer().removeEventListener('pointerdown', this.onMouseDownHandler);
		document.removeEventListener('keydown', this.onKeyDownHandler);
		document.removeEventListener('keyup', this.onKeyUpHandler);
	}

	active(): boolean {
		return this.shiftPressed || this.selecting;
	}

	getMousePosition(event: MouseEvent): Point {
		const container = this.map!.getContainer();
		const rect = container.getBoundingClientRect();
		// @ts-ignore
		return new Point(event.clientX - rect.left - container.clientLeft, event.clientY - rect.top - container.clientTop);
	}

	onKeyDown(event: KeyboardEvent): void {
		if (event.key == 'Shift') {
			this.activate(true);
		}

		if (event.key == 'Escape') {
			this.reset();
			this.activate(false);
			this.map!.fire('select.end', { features: [] });
		}
	}

	activate(yes: boolean): void {
		this.shiftPressed = yes;
		this.selectButton.activate(yes);
		this.map!.fire(`select.${yes ? 'enable' : 'disable'}`);
	}

	onKeyUp(event: KeyboardEvent): void {
		if (event.key == 'Shift') {
			this.activate(false);
		}
	}

	onMouseDown(event: MouseEvent): void {
		if (!this.shiftPressed) {
			return;
		}

		if (event.button === 0) {
			this.selecting = true;
			this.map!.dragPan.disable();
			this.startPos = this.getMousePosition(event);
			this.lastPos = this.startPos;
			document.addEventListener('pointermove', this.onMouseMoveHandler);
			document.addEventListener('pointerup', this.onMouseUpHandler);
			this.map!.fire('select.start');
		}
	}

	onMouseMove(event: MouseEvent): void {
		this.lastPos = this.getMousePosition(event);

		const minX = Math.min(this.startPos!.x, this.lastPos!.x),
			maxX = Math.max(this.startPos!.x, this.lastPos!.x),
			minY = Math.min(this.startPos!.y, this.lastPos!.y),
			maxY = Math.max(this.startPos!.y, this.lastPos!.y);

		const transform = `translate(${minX}px, ${minY}px)`;
		const width = maxX - minX + 'px';
		const height = maxY - minY + 'px';
		this.updateBoxStyle({ transform, width, height });
	}

	onMouseUp(event: MouseEvent): void {
		this.reset();

		if (!this.active()) {
			return;
		}

		const features = this.map!.queryRenderedFeatures([this.startPos!, this.lastPos!], {
			layers: this.layers,
		});

		this.map!.fire('select.end', { features, alt: event.altKey });
	}

	reset(): void {
		this.selecting = false;
		this.updateBoxStyle({ width: '0', height: '0', transform: '' });
		document.removeEventListener('pointermove', this.onMouseMoveHandler);
		document.removeEventListener('pointerup', this.onMouseUpHandler);
		this.map!.dragPan.enable();
	}

	updateBoxStyle(style: { width: string; height: string; transform: string }): void {
		this.boxElement.style.transform = style.transform;
		this.boxElement.style.width = style.width;
		this.boxElement.style.height = style.height;
	}
}
