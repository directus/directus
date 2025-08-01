import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { DirectusMCP, DirectusTransport } from './server.js';
import { isDirectusError } from '@directus/errors';
import { findMcpTool } from './tools/index.js';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { ToolConfig } from './tool.js';

// Mock dependencies
vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({ MCP_PREVENT_DELETE: false }))
}));

vi.mock('@directus/errors', () => ({
	ForbiddenError: class ForbiddenError extends Error {
		code = 'FORBIDDEN';
		constructor(message = 'Forbidden') {
			super(message);
		}
	},
	InvalidPayloadError: class InvalidPayloadError extends Error {
		code = 'INVALID_PAYLOAD';
		constructor({ reason }: { reason: string }) {
			super(reason);
		}
	},
	isDirectusError: vi.fn((error: any) => error && typeof error.code === 'string')
}));

vi.mock('../utils/sanitize-query.js', () => ({
	sanitizeQuery: vi.fn((query) => Promise.resolve(query))
}));

vi.mock('./tools/index.js', () => ({
	getAllMcpTools: vi.fn(() => [
		{
			name: 'test-tool',
			description: 'A test tool',
			inputSchema: { parse: vi.fn(), safeParse: vi.fn() },
			admin: false,
			annotations: {}
		},
		{
			name: 'admin-tool',
			description: 'An admin tool',
			inputSchema: { parse: vi.fn(), safeParse: vi.fn() },
			admin: true,
			annotations: {}
		}
	]),
	findMcpTool: vi.fn((name: string) => {
		const tools = {
			'test-tool': {
				name: 'test-tool',
				description: 'A test tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { test: 'value' } })) },
				admin: false,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'test result' }))
			},
			'admin-tool': {
				name: 'admin-tool',
				description: 'An admin tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { admin: 'value' } })) },
				admin: true,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'admin result' }))
			},
			'delete-tool': {
				name: 'delete-tool',
				description: 'A delete tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { action: 'delete' } })) },
				admin: false,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'deleted' }))
			}
		};

		return tools[name as keyof typeof tools] || null;
	})
}));

vi.mock('zod-to-json-schema', () => ({
	zodToJsonSchema: vi.fn(() => ({ type: 'object' }))
}));

vi.mock('zod-validation-error', () => ({
	fromZodError: vi.fn((_error) => ({ message: 'Validation error' }))
}));

function awaitJsonResponse(mcp: DirectusMCP): Promise<void> {
    return new Promise<void>((res) => {
        const _send = mcp.server.transport!.send.bind(mcp.server.transport!);

        mcp.server.transport!.send = async (...args) => {
            _send(...args);
            res();
        }
    });
}

describe('DirectusMCP', () => {
	let directusMCP: DirectusMCP;
	let mockReq: Partial<Request>;
	let mockRes: Response;

	beforeEach(() => {
		directusMCP = new DirectusMCP();
		
		mockRes = {
			json: vi.fn(),
			status: vi.fn().mockReturnThis(),
			send: vi.fn(),
		} as unknown as Response;

		mockReq = {
			accepts: vi.fn((type: string) => type === 'application/json' ? 'application/json' : false) as unknown as Request['accepts'],
			body: {
				jsonrpc: '2.0',
				id: 1,
				method: 'tools/list'
			},
			accountability: { admin: false } as Accountability,
			schema: {} as SchemaOverview,
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleRequest', () => {
		it('should reject non-JSON requests', async () => {
			mockReq.accepts = vi.fn(() => false) as unknown as Request['accepts'];
			
			directusMCP.handleRequest(mockReq as Request, mockRes as Response);
			
			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.send).toHaveBeenCalled();
		});

		it('should accept JSON requests', async () => {
			expect(() => directusMCP.handleRequest(mockReq as Request, mockRes as Response)).not.toThrow();
		});

		it('should handle invalid JSON-RPC messages', async () => {
			mockReq.body = { invalid: 'message' };
			
			expect(() => directusMCP.handleRequest(mockReq as Request, mockRes as Response)).toThrow();
		});
	});

	describe('tool listing', () => {
		it('should filter admin tools for non-admin users', async () => {			
			// Simulate non-admin user
			mockReq.accountability = { admin: false } as Accountability;
			
			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

            await awaitJsonResponse(directusMCP);

            expect(mockRes.json).toHaveBeenCalledWith({
                id: 1,
                jsonrpc: "2.0",
                result: {
                    tools: [
                        {
                            annotations: {},
                            description: "A test tool",
                            inputSchema: { type: "object" },
                            name: "test-tool",
                        },
                    ],
                },
            });
		});

		it('should include admin tools for admin users', async () => {			
			// Simulate admin user
			mockReq.accountability = { admin: true } as Accountability;
			
			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

            await awaitJsonResponse(directusMCP);
			
            expect(mockRes.json).toHaveBeenCalledWith({
                id: 1,
                jsonrpc: "2.0",
                result: {
                    tools: [
                        {
                            annotations: {},
                            description: "A test tool",
                            inputSchema: { type: "object" },
                            name: "test-tool",
                        },
                        {
                            annotations: {},
                            description: "An admin tool",
                            inputSchema: { type: "object" },
                            name: "admin-tool",
                        },
                    ],
                },
            });
		});
	});

    describe('tool execution', () => {
    	let mockRes: Partial<Response>;

    	beforeEach(() => {
    		mockRes = {
    			json: vi.fn(),
    			status: vi.fn().mockReturnThis(),
    			send: vi.fn()
    		};
    	});

    	it('should execute a valid tool successfully', async () => {
    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/call',
    				params: {
    					name: 'test-tool',
    					arguments: { test: 'value' }
    				}
    			},
    			accountability: { admin: false },
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq as Request, mockRes as Response);

            await awaitJsonResponse(directusMCP);

    		// Verify the response was sent via res.json
    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					content: expect.arrayContaining([
    						expect.objectContaining({
    							type: 'text',
    							text: JSON.stringify('test result')
    						})
    					])
    				})
    			})
    		);
    	});

    	it('should return error for non-existent tool', async () => {
    		vi.mocked(findMcpTool).mockReturnValueOnce(undefined);

    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/call',
    				params: {
    					name: 'non-existent-tool',
    					arguments: {}
    				}
    			},
    			accountability: { admin: false },
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq, mockRes as Response);
            
            await awaitJsonResponse(directusMCP);

    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					isError: true,
    					content: expect.arrayContaining([
    						expect.objectContaining({
    							type: 'text',
    							text: expect.stringContaining("doesn't exist in the toolset")
    						})
    					])
    				})
    			})
    		);
    	});

    	it('should prevent non-admin users from accessing admin tools', async () => {
    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/call',
    				params: {
    					name: 'admin-tool',
    					arguments: {}
    				}
    			},
    			accountability: { admin: false }, // Non-admin user
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq, mockRes as Response);

            await awaitJsonResponse(directusMCP);

    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					isError: true,
    					content: expect.arrayContaining([
    						expect.objectContaining({
    							type: 'text',
    							text: expect.stringContaining('FORBIDDEN')
    						})
    					])
    				})
    			})
    		);
    	});

    	it('should allow admin users to access admin tools', async () => {
    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/call',
    				params: {
    					name: 'admin-tool',
    					arguments: {}
    				}
    			},
    			accountability: { admin: true }, // Admin user
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq, mockRes as Response);

            await awaitJsonResponse(directusMCP);

    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					content: expect.arrayContaining([
    						expect.objectContaining({
    							type: 'text',
    							text: JSON.stringify('admin result')
    						})
    					])
    				})
    			})
    		);
    	});

    	it('should handle validation errors', async () => {
    		// Mock the tool to return validation error
    		const mockTool = {
    			name: 'validation-tool',
    			validateSchema: {
    				safeParse: vi.fn(() => ({
    					error: { issues: [{ message: 'Invalid input' }] }
    				}))
    			},
    			admin: false,
    			handler: vi.fn()
    		} as unknown as ToolConfig<any>;
            
    		vi.mocked(findMcpTool).mockReturnValueOnce(mockTool);

    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/call',
    				params: {
    					name: 'validation-tool',
    					arguments: { invalid: 'data' }
    				}
    			},
    			accountability: { admin: false },
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq, mockRes as Response);

            await awaitJsonResponse(directusMCP);

    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					isError: true,
    					content: expect.arrayContaining([
    						expect.objectContaining({
    							type: 'text',
    							text: expect.stringContaining('Validation error')
    						})
    					])
    				})
    			})
    		);
    	});

    	it('should handle tools/list requests', async () => {
    		const mockReq = {
    			accepts: vi.fn(() => 'application/json'),
    			body: {
    				jsonrpc: '2.0',
    				id: 1,
    				method: 'tools/list'
    			},
    			accountability: { admin: false },
    			schema: {}
    		} as unknown as Request;

    		directusMCP.handleRequest(mockReq, mockRes as Response);

            await awaitJsonResponse(directusMCP);

    		expect(mockRes.json).toHaveBeenCalledWith(
    			expect.objectContaining({
    				jsonrpc: '2.0',
    				id: 1,
    				result: expect.objectContaining({
    					tools: expect.arrayContaining([
    						expect.objectContaining({
    							name: 'test-tool',
    							description: 'A test tool'
    						})
    					])
    				})
    			})  
    		);
    	});

    	// it('should handle initialized notifications', async () => {
    	// 	const mockReq = {
    	// 		accepts: vi.fn(() => 'application/json'),
    	// 		body: {
    	// 			jsonrpc: '2.0',
    	// 			method: 'notifications/initialized'
    	// 		},
    	// 		accountability: { admin: false },
    	// 		schema: {}
    	// 	} as unknown as Request;

    	// 	directusMCP.handleRequest(mockReq, mockRes as Response);

        //     await new Promise<void>((resolve) => {
        //         const _status = mockRes.status!;

        //         mockRes.status = vi.fn((...args: any[]) => {
        //             _status(...args);
        //             resolve();
        //         }) as unknown as Response['status'];
        //     })
        //     // await awaitResponse(directusMCP);

        //     console.log('expect 2');
    	// 	expect(mockRes.status).toHaveBeenCalledWith(202);
    	// 	expect(mockRes.send).toHaveBeenCalled();
    	// });
    });

	describe('toMCPResponse', () => {
		it('should return empty content for undefined result', () => {
			const response = directusMCP.toMCPResponse(undefined);
			expect(response).toEqual({ content: [] });
		});

		it('should return empty content for null data', () => {
			const response = directusMCP.toMCPResponse({ type: 'text', data: null });
			expect(response).toEqual({ content: [] });
		});

		it('should return empty content for undefined data', () => {
			const response = directusMCP.toMCPResponse({ type: 'text', data: undefined });
			expect(response).toEqual({ content: [] });
		});

		it('should format text type responses', () => {
			const result = { type: 'text' as const, data: { message: 'hello' } };
			const response = directusMCP.toMCPResponse(result);
			
			expect(response).toEqual({
				content: [{
					type: 'text',
					text: JSON.stringify({ message: 'hello' })
				}]
			});
		});

		it('should return result directly for non-text types', () => {
			const result = { type: 'image' as const, data: 'base64data', mimeType: 'image/png' };
			const response = directusMCP.toMCPResponse(result);
			
			expect(response).toEqual({
				content: [result]
			});
		});
	});

	describe('toMCPError', () => {
		it('should handle Directus errors', () => {
			vi.mocked(isDirectusError).mockReturnValueOnce(true);
			
			const error = { message: 'Test error', code: 'TEST_ERROR' };
			const response = directusMCP.toMCPError(error);
			
			expect(response.isError).toBe(true);
			expect(response.content[0]?.type).toBe('text');
			
			const parsedContent = JSON.parse(response.content[0]!.text);

			expect(parsedContent[0]).toEqual({
				error: 'Test error',
				code: 'TEST_ERROR'
			});
		});

		it('should handle generic Error objects', () => {
			vi.mocked(isDirectusError).mockReturnValueOnce(false);
			
			const error = new Error('Generic error');
			const response = directusMCP.toMCPError(error);
			
			expect(response.isError).toBe(true);
			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('Generic error');
		});

		it('should handle string errors', () => {
			vi.mocked(isDirectusError).mockReturnValueOnce(false);
			
			const error = 'String error message';
			const response = directusMCP.toMCPError(error);
			
			expect(response.isError).toBe(true);
			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('String error message');
		});

		it('should handle object errors with message property', () => {
			vi.mocked(isDirectusError).mockReturnValueOnce(false);
			
			const error = { message: 'Object error', code: 'OBJ_ERROR' };
			const response = directusMCP.toMCPError(error);
			
			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);

			expect(parsedContent[0]).toEqual({
				error: 'Object error',
				code: 'OBJ_ERROR'
			});
		});

		it('should handle unknown error types', () => {
			vi.mocked(isDirectusError).mockReturnValueOnce(false);
			
			const error = 123; // Number, unknown type
			const response = directusMCP.toMCPError(error);
			
			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('An unknown error occurred.');
		});

		it('should handle array of errors', () => {
			vi.mocked(isDirectusError).mockReturnValue(false);
			
			const errors = [
				new Error('First error'),
				'Second error',
				{ message: 'Third error', code: 'THIRD' }
			];
			
			const response = directusMCP.toMCPError(errors);
			
			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent).toHaveLength(3);
			expect(parsedContent[0].error).toBe('First error');
			expect(parsedContent[1].error).toBe('Second error');

			expect(parsedContent[2]).toEqual({
				error: 'Third error',
				code: 'THIRD'
			});
		});
	});

	describe('DirectusTransport', () => {
		let transport: DirectusTransport;
		let mockRes: Partial<Response>;

		beforeEach(() => {
			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn()
			};

			transport = new DirectusTransport(mockRes as Response);
		});

		describe('send', () => {
			it('should send JSON-RPC message via response.json', async () => {
				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					result: { data: 'test' }
				};

				await transport.send(message);

				expect(mockRes.json).toHaveBeenCalledTimes(1);
				expect(mockRes.json).toHaveBeenCalledWith(message);
			});

			it('should send error responses', async () => {
				const errorMessage = {
					jsonrpc: '2.0' as const,
					id: 1,
					error: {
						code: -32600,
						message: 'Invalid Request'
					}
				};

				await transport.send(errorMessage);

				expect(mockRes.json).toHaveBeenCalledWith(errorMessage);
			});

			it('should send notification messages (no id)', async () => {
				const notification = {
					jsonrpc: '2.0' as const,
					method: 'notifications/initialized'
				};

				await transport.send(notification);

				expect(mockRes.json).toHaveBeenCalledWith(notification);
			});
		});

		describe('event handling', () => {
			it('should handle messages when onmessage is set', () => {
				const messageHandler = vi.fn();
				transport.onmessage = messageHandler;

				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					method: 'tools/list'
				};

				// Simulate message handling (this would typically be called by the server)
				transport.onmessage?.(message);

				expect(messageHandler).toHaveBeenCalledWith(message);
			});

			it('should handle errors when onerror is set', () => {
				const errorHandler = vi.fn();
				transport.onerror = errorHandler;

				const error = new Error('Transport error');

				// Simulate error handling
				transport.onerror?.(error);

				expect(errorHandler).toHaveBeenCalledWith(error);
			});

			it('should handle messages with extra info', () => {
				const messageHandler = vi.fn();
				transport.onmessage = messageHandler;

				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					method: 'tools/call',
					params: { name: 'test-tool' }
				};

				const extraInfo = { };

				transport.onmessage?.(message, extraInfo);

				expect(messageHandler).toHaveBeenCalledWith(message, extraInfo);
			});
		});
	});
});