import { Router } from 'express';
import { ApiExtensionContext } from './extensions';

export type EndpointRegisterFunction = (router: Router, context: ApiExtensionContext) => void;
