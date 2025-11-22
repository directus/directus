import { initTelemetry } from './telemetry/opentelemetry.js';
import { startServer } from './server.js';

initTelemetry();
startServer();
