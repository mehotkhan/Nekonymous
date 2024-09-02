import { Context } from "grammy";
import { Conversation, User } from "../types";
import { createMessageKeyboard } from "../utils/constant";
import { KVModel } from "../utils/kv-storage";
import { incrementStat } from "../utils/logs";
import {
  HuhMessage,
  NoConversationFoundMessage,
  RATE_LIMIT_MESSAGE,
  REPLAY_TO_MESSAGE,
  USER_BLOCKED_MESSAGE,
  USER_IS_BLOCKED_MESSAGE,
  USER_UNBLOCKED_MESSAGE,
} from "../utils/messages";
import { decryptPayload, getConversationId } from "../utils/ticket";
import { checkRateLimit } from "../utils/tools";

/**
 * Handles the reply action triggered from an inline keyboard.
 *
 * This function manages the process when a user clicks on the "reply" button in an inline keyboard.
 * It verifies the conversation context and initiates a reply by linking it to the correct conversation.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 * @param {KVModel<number>} statsModel - KVModel instance for managing stats data.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleReplyAction = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  statsModel: KVModel<number>,
  APP_SECURE_KEY: string
): Promise<void> => {
  const ticketId = ctx.match[1];
  const currentUserId = ctx.from?.id!;

  const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
  const conversationData = await conversationModel.get(conversationId);

  if (!conversationData) {
    await ctx.reply(NoConversationFoundMessage);
    await ctx.answerCallbackQuery();
    return;
  }

  const rawConversation = await decryptPayload(
    ticketId,
    conversationData,
    APP_SECURE_KEY
  );
  const parentConversation: Conversation = JSON.parse(rawConversation);

  try {
    const otherUser = await userModel.get(
      parentConversation.connection.from.toString()
    );
    // check rate limit
    const currentUser = await userModel.get(currentUserId.toString());

    if (checkRateLimit(currentUser.lastMessage)) {
      await ctx.reply(RATE_LIMIT_MESSAGE);
      return;
    }
    // Check if the other user has blocked the current user
    if (otherUser?.blockList.includes(currentUserId.toString())) {
      await ctx.reply(USER_IS_BLOCKED_MESSAGE);
      await ctx.answerCallbackQuery();
      return;
    }

    const conversation = {
      to: parentConversation.connection.from,
      parent_message_id: ctx.callbackQuery?.message?.message_id!,
      reply_to_message_id: parentConversation.connection.parent_message_id,
    };

    await userModel.updateField(
      currentUserId.toString(),
      "currentConversation",
      conversation
    );

    incrementStat(statsModel, "newConversation"); // Increment the reply stat
    await ctx.reply(REPLAY_TO_MESSAGE, {
      reply_markup: { force_reply: true },
      reply_to_message_id: ctx.callbackQuery?.message?.message_id!,
    });
  } catch (error) {
    await ctx.reply(HuhMessage);
  } finally {
    await ctx.answerCallbackQuery();
  }
};

/**
 * Handles the block action triggered from an inline keyboard.
 *
 * This function adds a user to the block list when the "block" button is clicked.
 * It ensures that further communication from the blocked user is prevented until they are unblocked.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 * @param {KVModel<number>} statsModel - KVModel instance for managing stats data.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleBlockAction = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  statsModel: KVModel<number>,
  APP_SECURE_KEY: string
): Promise<void> => {
  const ticketId = ctx.match[1];
  const currentUserId = ctx.from?.id!;

  const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
  const conversationData = await conversationModel.get(conversationId);

  if (!conversationData) {
    await ctx.reply(HuhMessage);
    await ctx.answerCallbackQuery();
    return;
  }

  const rawConversation = await decryptPayload(
    ticketId,
    conversationData,
    APP_SECURE_KEY
  );
  const parentConversation: Conversation = JSON.parse(rawConversation);

  try {
    await userModel.updateField(
      currentUserId.toString(),
      "blockList",
      parentConversation.connection.from.toString(),
      true
    );

    await incrementStat(statsModel, "blockedUsers"); // Increment the blocked user stat

    await ctx.api.sendMessage(currentUserId, USER_BLOCKED_MESSAGE, {
      reply_to_message_id: ctx.callbackQuery?.message?.message_id!,
    });
    const replyKeyboard = createMessageKeyboard(ticketId, true);
    await ctx.api.editMessageReplyMarkup(
      ctx.chat?.id!,
      ctx.callbackQuery?.message?.message_id!,
      {
        reply_markup: replyKeyboard,
      }
    );
  } catch (error) {
    await ctx.reply(HuhMessage);
  } finally {
    await ctx.answerCallbackQuery();
  }
};

/**
 * Handles the unblock action triggered from an inline keyboard.
 *
 * This function removes a user from the block list when the "unblock" button is clicked,
 * allowing communication to resume between the two users.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 * @param {KVModel<number>} statsModel - KVModel instance for managing stats data.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleUnblockAction = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  statsModel: KVModel<number>,
  APP_SECURE_KEY: string
): Promise<void> => {
  const ticketId = ctx.match[1];
  const currentUserId = ctx.from?.id!;

  const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
  const conversationData = await conversationModel.get(conversationId);

  if (!conversationData) {
    await ctx.reply(HuhMessage);
    await ctx.answerCallbackQuery();
    return;
  }

  const rawConversation = await decryptPayload(
    ticketId,
    conversationData,
    APP_SECURE_KEY
  );
  const parentConversation: Conversation = JSON.parse(rawConversation);

  try {
    const currentUser = await userModel.get(currentUserId.toString());

    if (
      currentUser?.blockList.includes(
        parentConversation.connection.from.toString()
      )
    ) {
      await userModel.popItemFromField(
        currentUserId.toString(),
        "blockList",
        parentConversation.connection.from.toString()
      );

      await incrementStat(statsModel, "unblockedUsers"); // Increment the unblocked user stat

      await ctx.api.sendMessage(currentUserId, USER_UNBLOCKED_MESSAGE, {
        reply_to_message_id: ctx.callbackQuery?.message?.message_id!,
      });
      const replyKeyboard = createMessageKeyboard(ticketId, false);
      await ctx.api.editMessageReplyMarkup(
        ctx.chat?.id!,
        ctx.callbackQuery?.message?.message_id!,
        {
          reply_markup: replyKeyboard,
        }
      );
    } else {
      await ctx.reply(HuhMessage);
    }
  } catch (error) {
    await ctx.reply(HuhMessage);
  } finally {
    await ctx.answerCallbackQuery();
  }
};
