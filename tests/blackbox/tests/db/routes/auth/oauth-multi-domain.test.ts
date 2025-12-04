import config, { paths } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import getPort from 'get-port';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('OAuth multi-domain and subpath support', () => {
  const directusInstances = {} as Record<Vendor, ChildProcess>;
  const serverPorts = {} as Record<Vendor, number>;
  const env = cloneDeep(config.envs);

  beforeAll(async () => {
    const promises = [];

    for (const vendor of vendors) {
      const newServerPort = await getPort();
      serverPorts[vendor] = newServerPort;

      env[vendor].PORT = String(newServerPort);
      env[vendor]['PUBLIC_URL'] = `http://127.0.0.1:${newServerPort}/api`;
      env[vendor]['AUTH_ALLOWED_ORIGINS'] = `http://127.0.0.1:${newServerPort}/api,http://localhost:${newServerPort}/api`;
      env[vendor]['AUTH_GITHUB_REDIRECT_ALLOW_LIST'] = 'https://external-frontend.com/callback';

      const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });
      directusInstances[vendor] = server;

      promises.push(awaitDirectusConnection(newServerPort));
    }

    await Promise.all(promises);
  }, 180_000);

  afterAll(async () => {
    for (const vendor of vendors) {
      directusInstances[vendor]?.kill();
    }
  });

  describe('callback URL includes subpath from PUBLIC_URL', () => {
    it.each(vendors)('%s', async (vendor) => {
      const port = serverPorts[vendor];
      const response = await request(`http://127.0.0.1:${port}`).get('/auth/login/github?redirect=/admin');

      expect(response.statusCode).toBe(302);

      const location = response.headers['location'] as string;
      const redirectUri = decodeURIComponent(location.split('redirect_uri=')[1]!.split('&')[0]!);

      // Callback URL should include the /api subpath from PUBLIC_URL
      expect(redirectUri).toBe(`http://127.0.0.1:${port}/api/auth/login/github/callback`);
    });
  });

  describe('callback URL uses matching AUTH_ALLOWED_ORIGINS', () => {
    it.each(vendors)('%s', async (vendor) => {
      const port = serverPorts[vendor];

      const response = await request(`http://localhost:${port}`).get('/auth/login/github?redirect=/admin');

      expect(response.statusCode).toBe(302);

      const location = response.headers['location'] as string;
      const redirectUri = decodeURIComponent(location.split('redirect_uri=')[1]!.split('&')[0]!);

      // Callback URL should use localhost (matching the request origin) with subpath
      expect(redirectUri).toBe(`http://localhost:${port}/api/auth/login/github/callback`);
    });
  });

  describe('cross-domain redirect allowed via REDIRECT_ALLOW_LIST', () => {
    it.each(vendors)('%s', async (vendor) => {
      const port = serverPorts[vendor];

      // Redirect to external frontend that's in the allow list
      const response = await request(`http://127.0.0.1:${port}`).get(
        `/auth/login/github?redirect=${env[vendor]['AUTH_GITHUB_REDIRECT_ALLOW_LIST']}`,
      );

      // Should redirect to GitHub (302)
      expect(response.statusCode).toBe(302);
      expect(response.headers['location']).toContain('github.com');
    });
  });

  describe('cross-domain redirect blocked when not in REDIRECT_ALLOW_LIST', () => {
    it.each(vendors)('%s', async (vendor) => {
      const port = serverPorts[vendor];

      // Redirect to domain NOT in allow list
      const response = await request(`http://127.0.0.1:${port}`).get(
        '/auth/login/github?redirect=https://malicious.com/steal',
      );

      expect(response.statusCode).toBe(400);
      expect(response.body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
    });
  });

  describe('redirect to PUBLIC_URL origin allowed without REDIRECT_ALLOW_LIST', () => {
    it.each(vendors)('%s', async (vendor) => {
      const port = serverPorts[vendor];

      // Redirect to PUBLIC_URL origin (should always be allowed)
      const response = await request(`http://127.0.0.1:${port}`).get(
        `/auth/login/github?redirect=http://127.0.0.1:${port}/api/admin`,
      );

      expect(response.statusCode).toBe(302);
      expect(response.headers['location']).toContain('github.com');
    });
  });
});

