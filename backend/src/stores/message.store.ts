import { supabaseAdmin } from '@config/supabaseClient';
import type {
  Conversation,
  Message,
  CreateMessageDTO,
  MessageStatus,
} from '../types/database.types';

export class MessageStore {
  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation> {
    // Try to find existing conversation (check both directions)
    const { data: existing1 } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('participant1_id', userId1)
      .eq('participant2_id', userId2)
      .maybeSingle();

    if (existing1) {
      return existing1 as Conversation;
    }

    const { data: existing2 } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('participant1_id', userId2)
      .eq('participant2_id', userId1)
      .maybeSingle();

    if (existing2) {
      return existing2 as Conversation;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        participant1_id: userId1,
        participant2_id: userId2,
        participant1_unread_count: 0,
        participant2_unread_count: 0,
        participant1_archived: false,
        participant2_archived: false,
        participant1_pinned: false,
        participant2_pinned: false,
        participant1_blocked: false,
        participant2_blocked: false,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }

    return newConversation as Conversation;
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Get all conversations for a user (excluding deleted and archived if needed)
   */
  static async getConversationsForUser(
    userId: string,
    includeArchived: boolean = false,
    limit?: number,
    offset?: number
  ): Promise<{ conversations: Conversation[]; count: number }> {
    // Get conversations where user is participant1
    const { data: data1 } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('participant1_id', userId)
      .is('participant1_deleted_at', null);

    // Get conversations where user is participant2
    const { data: data2 } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('participant2_id', userId)
      .is('participant2_deleted_at', null);

    // Combine and deduplicate
    let allConversations = [
      ...(data1 || []),
      ...(data2 || []),
    ] as Conversation[];

    // Filter archived if needed
    if (!includeArchived) {
      allConversations = allConversations.filter((conv) => {
        const isParticipant1 = conv.participant1_id === userId;
        return isParticipant1 ? !conv.participant1_archived : !conv.participant2_archived;
      });
    }

    // Sort by pinned first, then by last_message_at
    allConversations.sort((a, b) => {
      const aPinned = a.participant1_id === userId ? a.participant1_pinned : a.participant2_pinned;
      const bPinned = b.participant1_id === userId ? b.participant1_pinned : b.participant2_pinned;
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      if (!a.last_message_at && !b.last_message_at) return 0;
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    // Apply pagination
    const start = offset || 0;
    const end = start + (limit || 10);
    const paginatedConversations = allConversations.slice(start, end);

    return {
      conversations: paginatedConversations,
      count: allConversations.length,
    };
  }

  /**
   * Create a new message
   */
  static async createMessage(
    senderId: string,
    messageData: CreateMessageDTO
  ): Promise<Message> {
    // Get or create conversation
    const conversation = await this.getOrCreateConversation(senderId, messageData.recipient_id);

    // Check if blocked
    const isParticipant1 = conversation.participant1_id === senderId;
    if (isParticipant1 && conversation.participant2_blocked) {
      throw new Error('You are blocked by this user');
    }
    if (!isParticipant1 && conversation.participant1_blocked) {
      throw new Error('You are blocked by this user');
    }

    // Create message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        content: messageData.content,
        message_type: messageData.message_type || 'TEXT',
        status: 'SENT',
        is_read: false,
        archived: false,
        pinned: false,
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    // Update conversation
    const updates: Partial<Conversation> = {
      last_message_id: message.id,
      last_message_at: new Date().toISOString(),
    };

    // Increment unread count for recipient
    if (isParticipant1) {
      updates.participant2_unread_count = conversation.participant2_unread_count + 1;
    } else {
      updates.participant1_unread_count = conversation.participant1_unread_count + 1;
    }

    await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversation.id);

    // Mark as delivered
    await this.updateMessageStatus(message.id, 'DELIVERED');

    return message as Message;
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(
    messageId: string,
    status: MessageStatus
  ): Promise<Message> {
    const updates: Partial<Message> = { status };
    
    if (status === 'DELIVERED') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'READ') {
      updates.is_read = true;
      updates.read_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message status: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Update message content
   */
  static async updateMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    // Get message to verify ownership
    const { data: message, error: getError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (getError || !message) {
      throw new Error('Message not found');
    }

    if ((message as Message).sender_id !== userId) {
      throw new Error('Unauthorized: Can only edit your own messages');
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        content,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Get messages for a conversation (excluding deleted for the user)
   */
  static async getMessagesForConversation(
    conversationId: string,
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{ messages: Message[]; count: number }> {
    // Verify user is part of the conversation
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    let query = supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .or(`deleted_by.is.null,deleted_by.neq.${userId}`); // Exclude messages deleted by this user

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    // Order by pinned first, then by created_at desc
    query = query.order('pinned', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    // Filter out messages deleted by this user
    const filteredMessages = ((data as Message[]) || []).filter(
      (msg) => !msg.deleted_by || msg.deleted_by !== userId
    );

    return {
      messages: filteredMessages,
      count: filteredMessages.length,
    };
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    // Verify user is part of the conversation
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    // Mark all unread messages as read and update status
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        status: 'READ',
      })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', userId); // Only mark messages not sent by the user

    if (updateError) {
      throw new Error(`Failed to mark messages as read: ${updateError.message}`);
    }

    // Reset unread count
    const isParticipant1 = conversation.participant1_id === userId;
    const updates: Partial<Conversation> = {};
    if (isParticipant1) {
      updates.participant1_unread_count = 0;
    } else {
      updates.participant2_unread_count = 0;
    }

    await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);
  }

  /**
   * Delete a message (soft delete - only for the user)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Get message
    const { data: message, error: getError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (getError || !message) {
      throw new Error('Message not found');
    }

    // Soft delete - mark as deleted by this user
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq('id', messageId);

    if (updateError) {
      throw new Error(`Failed to delete message: ${updateError.message}`);
    }
  }

  /**
   * Archive a message
   */
  static async archiveMessage(messageId: string, userId: string, archived: boolean): Promise<Message> {
    // Get message to verify access
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const conversation = await this.getConversationById(message.conversation_id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ archived })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Pin/unpin a message
   */
  static async pinMessage(messageId: string, userId: string, pinned: boolean): Promise<Message> {
    // Get message to verify access
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const conversation = await this.getConversationById(message.conversation_id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ pinned })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pin message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Get message by ID
   */
  static async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Search messages
   */
  static async searchMessages(
    userId: string,
    searchQuery: string,
    conversationId?: string,
    limit?: number,
    offset?: number
  ): Promise<{ messages: Message[]; count: number }> {
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .ilike('content', `%${searchQuery}%`);

    // Filter by conversation if provided
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
      
      // Verify user has access
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
        throw new Error('Unauthorized: Not a participant of this conversation');
      }
    } else {
      // Only search in user's conversations
      const { data: userConversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

      const conversationIds = (userConversations || []).map((c) => c.id);
      if (conversationIds.length > 0) {
        query = query.in('conversation_id', conversationIds);
      } else {
        return { messages: [], count: 0 };
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }

    // Filter out messages deleted by this user
    const filteredMessages = ((data as Message[]) || []).filter(
      (msg) => !msg.deleted_by || msg.deleted_by !== userId
    );

    // Apply pagination after filtering
    const start = offset || 0;
    const end = start + (limit || 20);
    const paginatedMessages = filteredMessages.slice(start, end);

    return {
      messages: paginatedMessages,
      count: filteredMessages.length,
    };
  }

  /**
   * Archive/unarchive a conversation
   */
  static async archiveConversation(
    conversationId: string,
    userId: string,
    archived: boolean
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const isParticipant1 = conversation.participant1_id === userId;
    const updates: Partial<Conversation> = {};
    
    if (isParticipant1) {
      updates.participant1_archived = archived;
    } else {
      updates.participant2_archived = archived;
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Delete a conversation (soft delete - only for the user)
   */
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const isParticipant1 = conversation.participant1_id === userId;
    const updates: Partial<Conversation> = {};
    
    if (isParticipant1) {
      updates.participant1_deleted_at = new Date().toISOString();
    } else {
      updates.participant2_deleted_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  /**
   * Pin/unpin a conversation
   */
  static async pinConversation(
    conversationId: string,
    userId: string,
    pinned: boolean
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const isParticipant1 = conversation.participant1_id === userId;
    const updates: Partial<Conversation> = {};
    
    if (isParticipant1) {
      updates.participant1_pinned = pinned;
    } else {
      updates.participant2_pinned = pinned;
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pin conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Block/unblock a user in a conversation
   */
  static async blockUser(
    conversationId: string,
    userId: string,
    blocked: boolean
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    const isParticipant1 = conversation.participant1_id === userId;
    const updates: Partial<Conversation> = {};
    
    if (isParticipant1) {
      updates.participant1_blocked = blocked;
    } else {
      updates.participant2_blocked = blocked;
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to block user: ${error.message}`);
    }

    return data as Conversation;
  }
}
