import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { MessageStore } from '@stores/message.store';
import { UserStore } from '@stores/user.store';

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { recipient_id, content, message_type } = req.body;

    if (!recipient_id || !content) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'recipient_id and content are required',
      });
      return;
    }

    // Check if recipient exists
    const recipient = await UserStore.getUserById(recipient_id);
    if (!recipient) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Recipient not found',
      });
      return;
    }

    // Cannot send message to yourself
    if (recipient_id === req.user.id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot send message to yourself',
      });
      return;
    }

    const message = await MessageStore.createMessage(req.user.id, {
      recipient_id,
      content,
      message_type: message_type || 'TEXT',
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    
    if (errorMessage.includes('blocked')) {
      res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const updateMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { messageId } = req.params;
    const { content } = req.body;

    if (!messageId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Message ID is required',
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Content is required',
      });
      return;
    }

    const updatedMessage = await MessageStore.updateMessage(messageId, req.user.id, content);

    res.status(200).json({
      message: 'Message updated successfully',
      data: updatedMessage,
    });
  } catch (error) {
    console.error('Update message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { limit, offset, include_archived } = req.query;

    const result = await MessageStore.getConversationsForUser(
      req.user.id,
      include_archived === 'true',
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    );

    // Get user info for each participant
    const conversationsWithUsers = await Promise.all(
      result.conversations.map(async (conversation) => {
        const otherUserId =
          conversation.participant1_id === req.user!.id
            ? conversation.participant2_id
            : conversation.participant1_id;

        const otherUser = await UserStore.getUserById(otherUserId);
        const unreadCount =
          conversation.participant1_id === req.user!.id
            ? conversation.participant1_unread_count
            : conversation.participant2_unread_count;

        const isPinned =
          conversation.participant1_id === req.user!.id
            ? conversation.participant1_pinned
            : conversation.participant2_pinned;

        const isArchived =
          conversation.participant1_id === req.user!.id
            ? conversation.participant1_archived
            : conversation.participant2_archived;

        return {
          ...conversation,
          other_user: otherUser
            ? {
                id: otherUser.id,
                first_name: otherUser.first_name,
                last_name: otherUser.last_name,
                avatar_url: otherUser.avatar_url,
                role: otherUser.role,
              }
            : null,
          unread_count: unreadCount,
          pinned: isPinned,
          archived: isArchived,
        };
      })
    );

    res.status(200).json({
      conversations: conversationsWithUsers,
      count: result.count,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get conversations',
    });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    const { limit, offset } = req.query;

    const result = await MessageStore.getMessagesForConversation(
      conversationId,
      req.user.id,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    );

    // Mark messages as read when user views them
    await MessageStore.markMessagesAsRead(conversationId, req.user.id);

    res.status(200).json({
      messages: result.messages.reverse(), // Reverse to show oldest first
      count: result.count,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get messages';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    await MessageStore.markMessagesAsRead(conversationId, req.user.id);

    res.status(200).json({
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark messages as read';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { messageId } = req.params;
    if (!messageId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Message ID is required',
      });
      return;
    }

    await MessageStore.deleteMessage(messageId, req.user.id);

    res.status(200).json({
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const archiveMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { messageId } = req.params;
    const { archived } = req.body;

    if (!messageId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Message ID is required',
      });
      return;
    }

    if (typeof archived !== 'boolean') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'archived must be a boolean',
      });
      return;
    }

    const message = await MessageStore.archiveMessage(messageId, req.user.id, archived);

    res.status(200).json({
      message: archived ? 'Message archived successfully' : 'Message unarchived successfully',
      data: message,
    });
  } catch (error) {
    console.error('Archive message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive message';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const pinMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { messageId } = req.params;
    const { pinned } = req.body;

    if (!messageId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Message ID is required',
      });
      return;
    }

    if (typeof pinned !== 'boolean') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'pinned must be a boolean',
      });
      return;
    }

    const message = await MessageStore.pinMessage(messageId, req.user.id, pinned);

    res.status(200).json({
      message: pinned ? 'Message pinned successfully' : 'Message unpinned successfully',
      data: message,
    });
  } catch (error) {
    console.error('Pin message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to pin message';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { q, conversation_id, limit, offset } = req.query;

    if (!q) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Search query (q) is required',
      });
      return;
    }

    const result = await MessageStore.searchMessages(
      req.user.id,
      q as string,
      conversation_id ? (conversation_id as string) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    );

    res.status(200).json({
      messages: result.messages,
      count: result.count,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
  } catch (error) {
    console.error('Search messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search messages';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const archiveConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    const { archived } = req.body;

    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    if (typeof archived !== 'boolean') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'archived must be a boolean',
      });
      return;
    }

    const conversation = await MessageStore.archiveConversation(
      conversationId,
      req.user.id,
      archived
    );

    res.status(200).json({
      message: archived ? 'Conversation archived successfully' : 'Conversation unarchived successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive conversation';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    await MessageStore.deleteConversation(conversationId, req.user.id);

    res.status(200).json({
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const pinConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    const { pinned } = req.body;

    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    if (typeof pinned !== 'boolean') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'pinned must be a boolean',
      });
      return;
    }

    const conversation = await MessageStore.pinConversation(
      conversationId,
      req.user.id,
      pinned
    );

    res.status(200).json({
      message: pinned ? 'Conversation pinned successfully' : 'Conversation unpinned successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('Pin conversation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to pin conversation';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const blockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { conversationId } = req.params;
    const { blocked } = req.body;

    if (!conversationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required',
      });
      return;
    }

    if (typeof blocked !== 'boolean') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'blocked must be a boolean',
      });
      return;
    }

    const conversation = await MessageStore.blockUser(
      conversationId,
      req.user.id,
      blocked
    );

    res.status(200).json({
      message: blocked ? 'User blocked successfully' : 'User unblocked successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('Block user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to block user';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};
