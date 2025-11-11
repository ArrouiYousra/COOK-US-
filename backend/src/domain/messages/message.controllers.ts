import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { MessageStore } from "@stores/message.store";
import { UserStore } from "@stores/user.store";

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { recipient_id, content, message_type, attachment_url, booking_id } =
      req.body;

    if (!recipient_id || !content) {
      res.status(400).json({
        error: "Bad Request",
        message: "recipient_id and content are required",
      });
      return;
    }

    // Check if recipient exists
    const recipient = await UserStore.getUserById(recipient_id);
    if (!recipient) {
      res.status(404).json({
        error: "Not Found",
        message: "Recipient not found",
      });
      return;
    }

    // Cannot send message to yourself
    if (recipient_id === req.user.id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Cannot send message to yourself",
      });
      return;
    }

    const message = await MessageStore.createMessage(req.user.id, {
      recipient_id,
      content,
      message_type: message_type || "TEXT",
      attachment_url,
      booking_id,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send message";
    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const getConversations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { limit, offset } = req.query;

    const result = await MessageStore.getConversationsForUser(
      req.user.id,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined,
    );

    // Get user info and participant data for each conversation
    const conversationsWithUsers = await Promise.all(
      result.conversations.map(async (conversation) => {
        // Get all participants
        const participants = await MessageStore.getConversationParticipants(
          conversation.id,
        );

        // Find the other user (not the current user)
        const otherParticipant = participants.find(
          (p) => p.user_id !== req.user!.id,
        );
        if (!otherParticipant) {
          return null;
        }

        const otherUser = await UserStore.getUserById(otherParticipant.user_id);
        const currentParticipant = participants.find(
          (p) => p.user_id === req.user!.id,
        );

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
          unread_count: currentParticipant?.unread_count || 0,
          last_read_at: currentParticipant?.last_read_at || null,
        };
      }),
    );

    // Filter out null values
    const validConversations = conversationsWithUsers.filter((c) => c !== null);

    res.status(200).json({
      conversations: validConversations,
      count: result.count,
      limit: limit ? parseInt(limit as string, 10) : 10,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get conversations",
    });
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Conversation ID is required",
      });
      return;
    }

    const { limit, offset } = req.query;

    const result = await MessageStore.getMessagesForConversation(
      conversationId,
      req.user.id,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined,
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
    console.error("Get messages error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get messages";

    if (
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("not found")
    ) {
      res.status(404).json({
        error: "Not Found",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Conversation ID is required",
      });
      return;
    }

    await MessageStore.markMessagesAsRead(conversationId, req.user.id);

    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to mark messages as read";

    if (
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("not found")
    ) {
      res.status(404).json({
        error: "Not Found",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const updateMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { messageId } = req.params;
    const { content } = req.body;

    if (!messageId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Message ID is required",
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        error: "Bad Request",
        message: "Content is required",
      });
      return;
    }

    const updatedMessage = await MessageStore.updateMessage(
      messageId,
      req.user.id,
      content,
    );

    res.status(200).json({
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Update message error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update message";

    if (
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("not found")
    ) {
      res.status(404).json({
        error: "Not Found",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { messageId } = req.params;
    if (!messageId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Message ID is required",
      });
      return;
    }

    await MessageStore.deleteMessage(messageId, req.user.id);

    res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete message";

    if (
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("not found")
    ) {
      res.status(404).json({
        error: "Not Found",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};
