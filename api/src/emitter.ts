import { EventEmitter2 } from 'eventemitter2';

const emitter = new EventEmitter2({ wildcard: true, verboseMemoryLeak: true });

export default emitter;
