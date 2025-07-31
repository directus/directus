import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { flows, operations, triggerFlow } from './flows.js';
import { FlowsService } from '../../services/flows.js';
import { OperationsService } from '../../services/operations.js';
import { getFlowManager } from '../../flows.js';
import type { Accountability, FlowRaw, Query, SchemaOverview } from '@directus/types';

// Mock the services and dependencies
vi.mock('../../services/flows');
vi.mock('../../services/operations');
vi.mock('../../flows');

const MockedFlowsService = vi.mocked(FlowsService);
const MockedOperationsService = vi.mocked(OperationsService);
const mockGetFlowManager = vi.mocked(getFlowManager);

describe('flows tool', () => {
  let mockFlowsService: {
    createOne: MockedFunction<any>;
    readOne: MockedFunction<any>;
    readByQuery: MockedFunction<any>;
    updateOne: MockedFunction<any>;
    deleteOne: MockedFunction<any>;
  };

  const mockSchema = {} as SchemaOverview;
  const mockAccountability = { user: 'test-user', role: 'test-role' } as Accountability;
  const mockSanitizedQuery = { fields: ['*'] } as Query;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowsService = {
      createOne: vi.fn(),
      readOne: vi.fn(),
      readByQuery: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
    };

    MockedFlowsService.mockImplementation(() => mockFlowsService as any);
  });

  describe('create action', () => {
    it('should create a flow and return the result', async () => {
      const mockFlowData = {
        name: 'Test Flow',
        trigger: 'manual',
        status: 'active'
      } satisfies Partial<FlowRaw>;

      const mockCreatedKey = 'flow-123';
      const mockCreatedFlow = { id: mockCreatedKey, ...mockFlowData };

      mockFlowsService.createOne.mockResolvedValue(mockCreatedKey);
      mockFlowsService.readOne.mockResolvedValue(mockCreatedFlow);

      const result = await flows.handler({
        args: { action: 'create', data: mockFlowData },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockFlowsService.createOne).toHaveBeenCalledWith(mockFlowData);
      expect(mockFlowsService.readOne).toHaveBeenCalledWith(mockCreatedKey);

      expect(result).toEqual({
        type: 'text',
        data: mockCreatedFlow
      });
    });

    it('should handle null result from readOne after create', async () => {
      const mockFlowData = { name: 'Test Flow', trigger: 'manual' } satisfies Partial<FlowRaw>;
      const mockCreatedKey = 'flow-123';

      mockFlowsService.createOne.mockResolvedValue(mockCreatedKey);
      mockFlowsService.readOne.mockResolvedValue(null);

      const result = await flows.handler({
        args: { action: 'create', data: mockFlowData },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(result).toEqual({
        type: 'text',
        data: null
      });
    });
  });

  describe('read action', () => {
    it('should read flows by query', async () => {
      const mockFlows = [
        { id: 'flow-1', name: 'Flow 1', trigger: 'manual' },
        { id: 'flow-2', name: 'Flow 2', trigger: 'event' }
      ];

      mockFlowsService.readByQuery.mockResolvedValue(mockFlows);

      const result = await flows.handler({
        args: { action: 'read' },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockFlowsService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);

      expect(result).toEqual({
        type: 'text',
        data: mockFlows
      });
    });
  });

  describe('update action', () => {
    it('should update a flow and return the updated result', async () => {
      const mockKey = 'flow-123';
      const mockUpdateData = { status: 'inactive', description: 'Updated description' } satisfies Partial<FlowRaw>;
      const mockUpdatedFlow = { id: mockKey, name: 'Test Flow', ...mockUpdateData };

      mockFlowsService.updateOne.mockResolvedValue(mockKey);
      mockFlowsService.readOne.mockResolvedValue(mockUpdatedFlow);

      const result = await flows.handler({
        args: { action: 'update', key: mockKey, data: mockUpdateData },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockFlowsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
      expect(mockFlowsService.readOne).toHaveBeenCalledWith(mockKey, mockSanitizedQuery);

      expect(result).toEqual({
        type: 'text',
        data: mockUpdatedFlow
      });
    });
  });

  describe('delete action', () => {
    it('should delete a flow and return the deleted key', async () => {
      const mockKey = 'flow-123';

      mockFlowsService.deleteOne.mockResolvedValue(mockKey);

      const result = await flows.handler({
        args: { action: 'delete', key: mockKey },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockFlowsService.deleteOne).toHaveBeenCalledWith(mockKey);

      expect(result).toEqual({
        type: 'text',
        data: mockKey
      });
    });
  });

  describe('invalid action', () => {
    it('should throw error for invalid action', async () => {
      await expect(flows.handler({
        args: { action: 'invalid' as any },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      })).rejects.toThrow('Invalid action.');
    });
  });
});

describe('operations tool', () => {
  let mockOperationsService: {
    createOne: MockedFunction<any>;
    readOne: MockedFunction<any>;
    readByQuery: MockedFunction<any>;
    updateOne: MockedFunction<any>;
    deleteOne: MockedFunction<any>;
  };

  const mockSchema = {} as SchemaOverview;
  const mockAccountability = { user: 'test-user', role: 'test-role' } as Accountability;
  const mockSanitizedQuery = { fields: ['*'] } as Query;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOperationsService = {
      createOne: vi.fn(),
      readOne: vi.fn(),
      readByQuery: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
    };

    MockedOperationsService.mockImplementation(() => mockOperationsService as any);
  });

  describe('create action', () => {
    it('should create an operation and return the result', async () => {
      const mockOperationData = {
        name: 'Test Operation',
        type: 'log',
        flow: 'flow-123'
      };

      const mockCreatedKey = 'operation-123';
      const mockCreatedOperation = { id: mockCreatedKey, ...mockOperationData };

      mockOperationsService.createOne.mockResolvedValue(mockCreatedKey);
      mockOperationsService.readOne.mockResolvedValue(mockCreatedOperation);

      const result = await operations.handler({
        args: { action: 'create', data: mockOperationData },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockOperationsService.createOne).toHaveBeenCalledWith(mockOperationData);
      expect(mockOperationsService.readOne).toHaveBeenCalledWith(mockCreatedKey);

      expect(result).toEqual({
        type: 'text',
        data: mockCreatedOperation
      });
    });
  });

  describe('read action', () => {
    it('should read operations by query', async () => {
      const mockOperations = [
        { id: 'op-1', name: 'Operation 1', type: 'log' },
        { id: 'op-2', name: 'Operation 2', type: 'webhook' }
      ];

      mockOperationsService.readByQuery.mockResolvedValue(mockOperations);

      const result = await operations.handler({
        args: { action: 'read' },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockOperationsService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);

      expect(result).toEqual({
        type: 'text',
        data: mockOperations
      });
    });
  });

  describe('update action', () => {
    it('should update an operation and return the updated result', async () => {
      const mockKey = 'operation-123';
      const mockUpdateData = { name: 'Updated Operation' };
      const mockUpdatedOperation = { id: mockKey, ...mockUpdateData };

      mockOperationsService.updateOne.mockResolvedValue(mockKey);
      mockOperationsService.readOne.mockResolvedValue(mockUpdatedOperation);

      const result = await operations.handler({
        args: { action: 'update', key: mockKey, data: mockUpdateData },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockOperationsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
      expect(mockOperationsService.readOne).toHaveBeenCalledWith(mockKey, mockSanitizedQuery);

      expect(result).toEqual({
        type: 'text',
        data: mockUpdatedOperation
      });
    });
  });

  describe('delete action', () => {
    it('should delete an operation and return the deleted key', async () => {
      const mockKey = 'operation-123';

      mockOperationsService.deleteOne.mockResolvedValue(mockKey);

      const result = await operations.handler({
        args: { action: 'delete', key: mockKey },
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: mockSanitizedQuery
      });

      expect(mockOperationsService.deleteOne).toHaveBeenCalledWith(mockKey);

      expect(result).toEqual({
        type: 'text',
        data: mockKey
      });
    });
  });
});

describe('triggerFlow tool', () => {
  let mockFlowManager: {
    runWebhookFlow: MockedFunction<any>;
  };

  const mockSchema = {} as SchemaOverview;
  const mockAccountability = { user: 'test-user', role: 'test-role' } as Accountability;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowManager = {
      runWebhookFlow: vi.fn(),
    };

    mockGetFlowManager.mockReturnValue(mockFlowManager as any);
  });

  describe('successful flow trigger', () => {
    it('should trigger a flow successfully with valid parameters', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        name: 'Test Flow',
        options: {
          collections: ['articles'],
          requireSelection: true,
          fields: [
            { field: 'title', meta: { required: true } },
            { field: 'content', meta: { required: false } }
          ]
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'POST' as const,
        collection: 'articles',
        keys: ['article-1', 'article-2'],
        data: { title: 'Test Article' },
        query: { limit: 10 },
        headers: { 'Content-Type': 'application/json' }
      };

      const mockResult = { success: true, message: 'Flow executed successfully' };
      mockFlowManager.runWebhookFlow.mockResolvedValue({ result: mockResult });

      const result = await triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      });

      expect(mockFlowManager.runWebhookFlow).toHaveBeenCalledWith(
        'POST-flow-123',
        {
          path: '/trigger/flow-123',
          query: mockArgs.query,
          body: mockArgs.data,
          method: 'POST',
          headers: mockArgs.headers,
        },
        { accountability: mockAccountability, schema: mockSchema }
      );

      expect(result).toEqual({
        type: 'text',
        data: mockResult
      });
    });

    it('should work with requireSelection set to false', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        options: {
          collections: ['articles'],
          requireSelection: false,
          fields: []
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'GET' as const,
        collection: 'articles',
        keys: [], // Empty keys should be allowed when requireSelection is false
        data: {}
      };

      const mockResult = { success: true };
      mockFlowManager.runWebhookFlow.mockResolvedValue({ result: mockResult });

      const result = await triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      });

      expect(result).toEqual({
        type: 'text',
        data: mockResult
      });
    });
  });

  describe('validation errors', () => {
    it('should throw error when flow definition is missing', async () => {
      const mockArgs = {
        flowDefinition: null as any,
        flowId: 'flow-123',
        method: 'GET' as const,
        collection: 'articles',
        keys: ['article-1']
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('Flow definition must be provided');
    });

    it('should throw error when flow ID mismatch', async () => {
      const mockFlowDefinition = {
        id: 'flow-456',
        options: { collections: ['articles'] }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123', // Different from definition
        method: 'GET' as const,
        collection: 'articles',
        keys: ['article-1']
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('Flow ID mismatch: provided flow-123 but definition has flow-456');
    });

    it('should throw error for invalid collection', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        options: {
          collections: ['articles', 'posts'],
          requireSelection: false
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'GET' as const,
        collection: 'users', // Not in allowed collections
        keys: [],
        data: {}
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('Invalid collection "users". This flow only supports: articles, posts');
    });

    it('should throw error when selection required but no keys provided', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        options: {
          collections: ['articles'],
          requireSelection: true // Selection required
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'GET' as const,
        collection: 'articles',
        keys: [], // Empty keys
        data: {}
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('This flow requires selecting at least one item, but no keys were provided');
    });

    it('should throw error for missing required fields', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        options: {
          collections: ['articles'],
          requireSelection: false,
          fields: [
            { field: 'title', meta: { required: true } },
            { field: 'author', meta: { required: true } },
            { field: 'content', meta: { required: false } }
          ]
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'POST' as const,
        collection: 'articles',
        keys: [],
        data: { title: 'Test Article' } // Missing required 'author' field
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('Missing required field: author');
    });

    it('should throw error when data is missing but required fields exist', async () => {
      const mockFlowDefinition = {
        id: 'flow-123',
        options: {
          collections: ['articles'],
          requireSelection: false,
          fields: [
            { field: 'title', meta: { required: true } }
          ]
        }
      };

      const mockArgs = {
        flowDefinition: mockFlowDefinition,
        flowId: 'flow-123',
        method: 'POST' as const,
        collection: 'articles',
        keys: [],
        data: undefined // No data provided
      };

      await expect(triggerFlow.handler({
        args: mockArgs,
        schema: mockSchema,
        accountability: mockAccountability,
        sanitizedQuery: {}
      })).rejects.toThrow('Missing required field: title');
    });
  });
});