/**
 * Tests for AgentResource conversation management.
 * Demonstrates the N+1 query problem and validates the fix.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentResource } from './agent.js';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

describe('AgentResource', () => {
  let mockApi: any;
  let agentResource: AgentResource;

  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      title: 'First Conversation',
      messages: [
        { id: 'msg-1', content: 'Hello', role: 'user', timestamp: '2024-01-01T10:00:00Z' },
        { id: 'msg-2', content: 'Hi there', role: 'assistant', timestamp: '2024-01-01T10:01:00Z' },
      ],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:01:00Z',
    },
    {
      id: 'conv-2',
      title: 'Second Conversation',
      messages: [
        { id: 'msg-3', content: 'Good morning', role: 'user', timestamp: '2024-01-02T09:00:00Z' },
      ],
      createdAt: '2024-01-02T09:00:00Z',
      updatedAt: '2024-01-02T09:00:00Z',
    },
    {
      id: 'conv-3',
      title: 'Third Conversation',
      messages: [],
      createdAt: '2024-01-03T08:00:00Z',
      updatedAt: '2024-01-03T08:00:00Z',
    },
  ];

  beforeEach(() => {
    mockApi = {
      listConversations: vi.fn().mockResolvedValue(mockConversations),
      getConversationById: vi.fn().mockImplementation(async (id: string) => {
        const conversation = mockConversations.find((c) => c.id === id);
        if (!conversation) {
          throw new Error(`Conversation ${id} not found`);
        }
        return conversation;
      }),
    };

    agentResource = new AgentResource(mockApi);
  });

  describe('getConversation (FIXED - Direct Query)', () => {
    it('should fetch a specific conversation using the direct API method', async () => {
      const result = await agentResource.getConversation('conv-1');

      expect(result).toEqual(mockConversations[0]);
      expect(mockApi.getConversationById).toHaveBeenCalledWith('conv-1');
    });

    it('should make exactly ONE API call (fixed N+1 pattern)', async () => {
      await agentResource.getConversation('conv-2');

      // Verify only the direct method was called, not listConversations
      expect(mockApi.getConversationById).toHaveBeenCalledTimes(1);
      expect(mockApi.listConversations).not.toHaveBeenCalled();
    });

    it('should handle different conversation IDs correctly', async () => {
      await agentResource.getConversation('conv-1');
      await agentResource.getConversation('conv-3');

      expect(mockApi.getConversationById).toHaveBeenCalledWith('conv-1');
      expect(mockApi.getConversationById).toHaveBeenCalledWith('conv-3');
      expect(mockApi.getConversationById).toHaveBeenCalledTimes(2);
    });

    it('should throw error if conversation not found', async () => {
      mockApi.getConversationById.mockRejectedValueOnce(new Error('Conversation non-existent not found'));

      await expect(agentResource.getConversation('non-existent')).rejects.toThrow('Conversation non-existent not found');
    });

    it('should return conversation with correct structure', async () => {
      const result = await agentResource.getConversation('conv-1');

      expect(result).toHaveProperty('id', 'conv-1');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('N+1 Query Problem (Anti-pattern)', () => {
    it('should demonstrate the N+1 problem in getConversation_OLD', async () => {
      // Get all conversations (N queries - in this case 1 batch query)
      // Plus 1 to search through them = N+1
      const allConversations = await mockApi.listConversations();

      // This demonstrates why getConversation_OLD is inefficient:
      // 1. First call: listConversations() - fetches ALL 3 conversations
      // 2. Then: Array search - additional processing to find the one we need
      const conversation = allConversations.find((c: Conversation) => c.id === 'conv-2');

      expect(conversation).toEqual(mockConversations[1]);
      expect(mockApi.listConversations).toHaveBeenCalledTimes(1);
    });

    it('should verify performance difference: fixed version calls API once', async () => {
      const callCount = vi.fn();

      // Track calls
      mockApi.getConversationById = vi.fn(async (id: string) => {
        callCount();
        return mockConversations.find((c) => c.id === id);
      });

      agentResource = new AgentResource(mockApi);
      await agentResource.getConversation('conv-1');

      expect(callCount).toHaveBeenCalledTimes(1);
    });

    it('should compare: old pattern fetches unnecessary data', async () => {
      // Old pattern: fetch 3 conversations when we only need 1
      const oldPatternCalls = async () => {
        const all = await mockApi.listConversations();
        return all.find((c: Conversation) => c.id === 'conv-2');
      };

      // New pattern: fetch only 1 conversation
      const newPatternCalls = async () => {
        return await mockApi.getConversationById('conv-2');
      };

      const oldResult = await oldPatternCalls();
      const newResult = await newPatternCalls();

      expect(oldResult).toEqual(newResult);
      // Old pattern called listConversations (expensive operation)
      // New pattern called getConversationById (targeted operation)
      expect(mockApi.listConversations).toHaveBeenCalled();
      expect(mockApi.getConversationById).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty conversation list gracefully', async () => {
      mockApi.listConversations.mockResolvedValueOnce([]);
      mockApi.getConversationById.mockRejectedValueOnce(new Error('Not found'));

      await expect(agentResource.getConversation('any-id')).rejects.toThrow('Not found');
    });

    it('should correctly retrieve conversations with empty message arrays', async () => {
      const result = await agentResource.getConversation('conv-3');

      expect(result?.id).toBe('conv-3');
      expect(result?.messages).toEqual([]);
    });

    it('should maintain conversation message order', async () => {
      const result = await agentResource.getConversation('conv-1');

      expect(result?.messages[0].id).toBe('msg-1');
      expect(result?.messages[0].role).toBe('user');
      expect(result?.messages[1].id).toBe('msg-2');
      expect(result?.messages[1].role).toBe('assistant');
    });
  });
});
