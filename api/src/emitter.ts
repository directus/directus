import { EventEmitter2 } from 'eventemitter2';

const emitter = new EventEmitter2({ wildcard: true, verboseMemoryLeak: true, delimiter: '.' });

// No-op function to ensure we never end up with no data
emitter.on('*.*.before', (input) => input);

export default emitter;
