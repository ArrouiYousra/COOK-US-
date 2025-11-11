import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  CreateMessageDTO,
} from "../types/database.types";

export class MessageStore {
  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(
    userId1: string,
    userId2: string,
    bookingId?: string,
  ): Promise<Conversation> {
    // Find existing conversation by checking conversation_participants
    const { data: participants } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .in("user_id", [userId1, userId2]);

    if (participants && participants.length > 0) {
      // Group by conversation_id to find conversations with both users
      const conversationIds = [
        ...new Set(participants.map((p: { conversation_id: string }) => p.conversation_id)),
      ];

      for (const convId of conversationIds) {
        const { data: convParticipants } = await supabaseAdmin
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convId);

        const participantIds = (convParticipants || []).map((p: { user_id: string }) => p.user_id);
        if (
          participantIds.includes(userId1) &&
          participantIds.includes(userId2)
        ) {
          const conversation = await this.getConversationById(convId);
          if (conversation) {
            return conversation;
          }
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabaseAdmin
      .from("conversations")
      .insert({
        booking_id: bookingId || null,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }

    // Create participants
    await supabaseAdmin.from("conversation_participants").insert([
      {
        conversation_id: newConversation.id,
        user_id: userId1,
        unread_count: 0,
      },
      {
        conversation_id: newConversation.id,
        user_id: userId2,
        unread_count: 0,
      },
    ]);

    return newConversation as Conversation;
  }

  /**
   * Get conversation by ID
   */
  static async getConversationById(
    conversationId: string,
  ): Promise<Conversation | null> {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Get conversation participant
   */
  static async getConversationParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | null> {
    const { data, error } = await supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(
        `Failed to get conversation participant: ${error.message}`,
      );
    }

    return data as ConversationParticipant;
  }

  /**
   * Get all conversations for a user
   */
  static async getConversationsForUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ conversations: Conversation[]; count: number }> {
    // Get all conversation IDs where user is a participant
    const { data: participants } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!participants || participants.length === 0) {
      return { conversations: [], count: 0 };
    }

    const conversationIds = participants.map((p: { conversation_id: string }) => p.conversation_id);

    let query = supabaseAdmin
      .from("conversations")
      .select("*", { count: "exact" })
      .in("id", conversationIds);

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    // Order by last_message_at desc
    query = query.order("last_message_at", {
      ascending: false,
      nullsFirst: false,
    });
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }

    return {
      conversations: (data as Conversation[]) || [],
      count: count || 0,
    };
  }

  /**
   * Create a new message
   */
  static async createMessage(
    senderId: string,
    messageData: CreateMessageDTO,
  ): Promise<Message> {
    // Get or create conversation
    const conversation = await this.getOrCreateConversation(
      senderId,
      messageData.recipient_id,
      messageData.booking_id,
    );

    // Create message
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: senderId,
        type: messageData.message_type || "TEXT",
        content: messageData.content || null,
        attachment_url: messageData.attachment_url || null,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    // Update conversation last_message_at
    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // Increment unread count for recipient
    const recipientParticipant = await this.getConversationParticipant(
      conversation.id,
      messageData.recipient_id,
    );

    if (recipientParticipant) {
      await supabaseAdmin
        .from("conversation_participants")
        .update({
          unread_count: recipientParticipant.unread_count + 1,
        })
        .eq("conversation_id", conversation.id)
        .eq("user_id", messageData.recipient_id);
    }

    return message as Message;
  }

  /**
   * Get messages for a conversation
   */
  static async getMessagesForConversation(
    conversationId: string,
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ messages: Message[]; count: number }> {
    // Verify user is part of the conversation
    const participant = await this.getConversationParticipant(
      conversationId,
      userId,
    );
    if (!participant) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    let query = supabaseAdmin
      .from("messages")
      .select("*", { count: "exact" })
      .eq("conversation_id", conversationId);

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    // Order by created_at desc (most recent first)
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return {
      messages: (data as Message[]) || [],
      count: count || 0,
    };
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Verify user is part of the conversation
    const participant = await this.getConversationParticipant(
      conversationId,
      userId,
    );
    if (!participant) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    // Mark all unread messages as read
    const { error: updateError } = await supabaseAdmin
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", userId); // Only mark messages not sent by the user

    if (updateError) {
      throw new Error(
        `Failed to mark messages as read: ${updateError.message}`,
      );
    }

    // Update participant last_read_at and reset unread count
    await supabaseAdmin
      .from("conversation_participants")
      .update({
        last_read_at: new Date().toISOString(),
        unread_count: 0,
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
  }

  /**
   * Get conversation participants
   */
  static async getConversationParticipants(
    conversationId: string,
  ): Promise<ConversationParticipant[]> {
    const { data, error } = await supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId);

    if (error) {
      throw new Error(
        `Failed to get conversation participants: ${error.message}`,
      );
    }

    return (data as ConversationParticipant[]) || [];
  }

  /**
   * Get message by ID
   */
  static async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Update message content
   */
  static async updateMessage(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<Message> {
    // Get message to verify ownership
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender_id !== userId) {
      throw new Error("Unauthorized: Can only edit your own messages");
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .update({ content })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return data as Message;
  }

  /**
   * Delete a message (hard delete)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Get message to verify ownership
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender_id !== userId) {
      throw new Error("Unauthorized: Can only delete your own messages");
    }

    const { error } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }
}
