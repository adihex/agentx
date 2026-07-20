/**
 * Agent resource handler for conversation management.
 * This module manages conversation retrieval from the API.
 */

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

/**
 * API client interface for conversation operations.
 */
interface ConversationAPI {
  listConversations(): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation>;
}

/**
 * Agent resource handler with N+1 query pattern (ANTI-PATTERN - TO BE FIXED).
 * Currently fetches all conversations then searches for a single one.
 */
export class AgentResource {
  private api: ConversationAPI;

  constructor(api: ConversationAPI) {
    this.api = api;
  }

  /**
   * ANTI-PATTERN: N+1 query issue.
   * This fetches ALL conversations, then searches for the one we need.
   * This is inefficient and represents the N+1 problem.
   *
   * @param conversationId - The ID of the conversation to retrieve
   * @returns The requested conversation, or undefined if not found
   */
  async getConversation_OLD(conversationId: string): Promise<Conversation | undefined> {
    // First query: fetch ALL conversations (N queries conceptually, but as one batch)
    const allConversations = await this.api.listConversations();

    // Second query: search through all of them to find the one we want (the +1)
    // This is wasteful - we're fetching data we don't need
    const conversation = allConversations.find((c) => c.id === conversationId);

    return conversation;
  }

  /**
   * FIXED: Direct query.
   * This fetches only the specific conversation we need.
   * This is the correct pattern - single direct query for a specific resource.
   *
   * @param conversationId - The ID of the conversation to retrieve
   * @returns The requested conversation, or undefined if not found
   */
  async getConversation(conversationId: string): Promise<Conversation | undefined> {
    // Single direct query for the specific conversation
    // The API should support fetching a conversation by its ID directly
    const conversation = await this.api.getConversationById(conversationId);

    return conversation;
  }
}
