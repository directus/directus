import mitt from 'mitt';

const emitter = mitt();

export default emitter;
export enum Events {
	upload = 'upload',
}
