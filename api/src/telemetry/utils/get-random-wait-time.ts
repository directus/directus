/**
 * Returns randomized value between 0 and 1.8e+6 (30min in ms) intended to be used as the randomized wait for
 * telemetry tracking
 */
export const getRandomWaitTime = () => Math.floor(Math.random() * 1.8e6);
