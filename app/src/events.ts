import mitt from 'mitt';

export const emitter = mitt();

export enum Events {
	upload = 'upload',
	tabActive = 'tab-active',
	tabHidden = 'tab-hidden',
	tabIdle = 'tab-idle',
}

export default emitter;
