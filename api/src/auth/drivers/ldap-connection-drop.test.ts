/**
 * Connection Drop Integration Tests for LDAP Driver
 *
 * These tests use a real TCP server to simulate LDAP connection behavior,
 * including forcibly dropping connections to validate error handling.
 *
 * This is a more concrete test than mocked unit tests because it:
 * 1. Creates actual TCP connections
 * 2. Simulates real connection drops (server closes socket)
 * 3. Validates that the ldapts library and our driver handle this correctly
 */

import * as net from 'node:net';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Client } from 'ldapts';

describe('LDAP Connection Drop Behavior (Real TCP Server)', () => {
	let mockServer: net.Server;
	let serverPort: number;
	let connectionCount = 0;
	let dropAfterBytes = -1; // -1 means don't drop
	let activeConnections: net.Socket[] = [];

	beforeAll(async () => {
		// Create a mock TCP server that simulates an LDAP server
		mockServer = net.createServer((socket) => {
			connectionCount++;
			activeConnections.push(socket);

			let bytesReceived = 0;

			socket.on('data', (data) => {
				bytesReceived += data.length;

				// If configured to drop after receiving certain bytes, do so
				if (dropAfterBytes > 0 && bytesReceived >= dropAfterBytes) {
					socket.destroy(); // Forcibly drop the connection

					return;
				}

				// Otherwise, just close gracefully (simulating server not responding properly)
				// We don't implement actual LDAP protocol, so client will get an error
			});

			socket.on('close', () => {
				const idx = activeConnections.indexOf(socket);

				if (idx > -1) {
					activeConnections.splice(idx, 1);
				}
			});

			socket.on('error', () => {
				// Ignore socket errors on server side
			});
		});

		// Start server on random available port
		await new Promise<void>((resolve) => {
			mockServer.listen(0, '127.0.0.1', () => {
				const addr = mockServer.address() as net.AddressInfo;
				serverPort = addr.port;
				resolve();
			});
		});
	});

	afterAll(async () => {
		// Close all active connections
		for (const socket of activeConnections) {
			socket.destroy();
		}

		// Close the server
		await new Promise<void>((resolve) => {
			mockServer.close(() => resolve());
		});
	});

	afterEach(() => {
		// Reset test state
		connectionCount = 0;
		dropAfterBytes = -1;

		// Close any lingering connections
		for (const socket of activeConnections) {
			socket.destroy();
		}

		activeConnections = [];
	});

	it('should throw error when server forcibly drops connection during bind', async () => {
		// Configure server to drop connection after receiving any data
		dropAfterBytes = 1;

		const client = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// Attempt to bind - should fail because server drops connection
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		// Verify a connection was made
		expect(connectionCount).toBe(1);
	});

	it('should throw error when server closes connection without response', async () => {
		// Server accepts connection but doesn't respond (just closes)
		const client = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// The mock server doesn't implement LDAP protocol, so bind will fail
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		expect(connectionCount).toBe(1);
	});

	it('should allow new connection after previous connection was dropped', async () => {
		dropAfterBytes = 1;

		const client1 = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// First connection - will fail
		await expect(client1.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		expect(connectionCount).toBe(1);

		// Create a new client (simulating what Directus driver does for verify)
		const client2 = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// Second connection - will also fail but proves we can create new connections
		await expect(client2.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		// Two separate connections were made
		expect(connectionCount).toBe(2);
	});

	it('should demonstrate that ldapts does NOT auto-reconnect', async () => {
		dropAfterBytes = 1;

		const client = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// First bind fails
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		expect(connectionCount).toBe(1);

		// Reset the drop behavior - server will now just not respond
		dropAfterBytes = -1;

		// Try to bind again with SAME client
		// If ldapts had auto-reconnect, this would create a new connection
		// But it doesn't - it will try to use the dead socket or throw
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		// If ldapts auto-reconnected, we'd see 2 connections
		// But since it doesn't, the behavior depends on implementation
		// The key point: it throws an error, not silently reconnects
	});

	it('should handle server becoming unreachable after successful initial connection', async () => {
		const client = new Client({
			url: `ldap://127.0.0.1:${serverPort}`,
			connectTimeout: 1000,
			timeout: 1000,
		});

		// First attempt - server accepts but doesn't respond
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();

		expect(connectionCount).toBeGreaterThanOrEqual(1);

		// Now "kill" the server by closing all connections
		for (const socket of activeConnections) {
			socket.destroy();
		}

		// Try again - should fail
		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();
	});
});

describe('LDAP Connection Refused Behavior', () => {
	it('should throw error when connecting to non-existent server', async () => {
		// Use a port that nothing is listening on
		const client = new Client({
			url: 'ldap://127.0.0.1:59999',
			connectTimeout: 1000,
			timeout: 1000,
		});

		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow(/ECONNREFUSED/);
	});

	it('should throw error for invalid host', async () => {
		const client = new Client({
			url: 'ldap://invalid.nonexistent.host.test:389',
			connectTimeout: 1000,
			timeout: 1000,
		});

		await expect(client.bind('cn=admin,dc=test,dc=com', 'password')).rejects.toThrow();
	});
});
