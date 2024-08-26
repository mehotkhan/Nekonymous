import { Context, InlineKeyboard } from "grammy";
import {
  HuhMessage,
  NoConversationFoundMessage,
  REPLAY_TO_MESSAGE,
  USER_BLOCKED_MESSAGE,
  USER_IS_BLOCKED_MESSAGE,
  USER_UNBLOCKED_MESSAGE,
} from "../utils/messages";
import { decryptPayload, getConversationId } from "../utils/ticket";
import { BlockList, Conversation, CurrentConversation } from "../types";
import { KVModel } from "../utils/kv-storage";

/**
 * Creates an inline keyboard with options to reply or block/unblock a user.
 *
 * This function generates an inline keyboard that allows users to either reply to a message
 * or block/unblock the sender, depending on the current blocked status.
 *
 * @param {string} ticketId - The unique ID of the conversation or message.
 * @param {boolean} isBlocked - Indicates whether the user is currently blocked.
 * @returns {InlineKeyboard} - The generated inline keyboard.
 */
export const createReplyKeyboard = (
  ticketId: string,
  isBlocked: boolean
): InlineKeyboard =>
  new InlineKeyboard()
    .text(
      isBlocked ? "آنبلاک" : "بلاک",
      isBlocked ? `unblock_${ticketId}` : `block_${ticketId}`
    )
    .text("پاسخ", `reply_${ticketId}`);

/**
 * Handles the reply action triggered from an inline keyboard.
 *
 * This function manages the process when a user clicks on the "reply" button in an inline keyboard.
 * It verifies the conversation context and initiates a reply by linking it to the correct conversation.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<CurrentConversation>} currentConversationModel - KVModel instance for managing current conversations.
 * @param {KVModel<BlockList>} userBlockListModel - KVModel instance for managing user block lists.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 */
export const handleReplyAction = async (
  ctx: Context,
  currentConversationModel: KVModel<CurrentConversation>,
  userBlockListModel: KVModel<BlockList>,
  conversationModel: KVModel<string>
): Promise<void> => {
  const ticketId = ctx.match[1];
  const conversationId = getConversationId(ticketId);

  const currentUserId = ctx.from?.id!;
  const conversationData = await conversationModel.get(conversationId);
  const rawConversation = await decryptPayload(ticketId, conversationData!);
  const parentConversation: Conversation = JSON.parse(rawConversation);

  try {
    if (parentConversation) {
      const blockList =
        (await userBlockListModel.get(parentConversation.from.toString())) ||
        {};
      if (blockList[currentUserId]) {
        await ctx.reply(USER_IS_BLOCKED_MESSAGE);
        await ctx.answerCallbackQuery();
        return;
      }

      const conversation = {
        to: parentConversation.from,
        reply_to_message_id: parentConversation.reply_to_message_id,
      };
      await currentConversationModel.save(
        currentUserId.toString(),
        conversation
      );
      await ctx.reply(REPLAY_TO_MESSAGE);
    } else {
      await ctx.reply(NoConversationFoundMessage);
    }
  } catch (error) {
    await ctx.reply(JSON.stringify(error));
  }
  await ctx.answerCallbackQuery();
};

/**
 * Handles the block action triggered from an inline keyboard.
 *
 * This function adds a user to the block list when the "block" button is clicked.
 * It ensures that further communication from the blocked user is prevented until they are unblocked.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<BlockList>} userBlockListModel - KVModel instance for managing user block lists.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 */
export const handleBlockAction = async (
  ctx: Context,
  userBlockListModel: KVModel<BlockList>,
  conversationModel: KVModel<string>
): Promise<void> => {
  const ticketId = ctx.match[1];
  const conversationId = getConversationId(ticketId);

  const currentUserId = ctx.from?.id!;
  const conversationData = await conversationModel.get(conversationId);
  const rawConversation = await decryptPayload(ticketId, conversationData!);
  const parentConversation: Conversation = JSON.parse(rawConversation);

  if (parentConversation) {
    let blockList = await userBlockListModel.get(currentUserId.toString());
    if (!blockList) {
      blockList = {};
    }

    blockList[parentConversation.from?.toString()] = true;
    await userBlockListModel.save(currentUserId.toString(), blockList);
    await ctx.reply(USER_BLOCKED_MESSAGE);

    const replyKeyboard = createReplyKeyboard(ticketId, true);
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

  await ctx.answerCallbackQuery();
};

/**
 * Handles the unblock action triggered from an inline keyboard.
 *
 * This function removes a user from the block list when the "unblock" button is clicked,
 * allowing communication to resume between the two users.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<BlockList>} userBlockListModel - KVModel instance for managing user block lists.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 */
export const handleUnblockAction = async (
  ctx: Context,
  userBlockListModel: KVModel<BlockList>,
  conversationModel: KVModel<string>
): Promise<void> => {
  const ticketId = ctx.match[1];
  const conversationId = getConversationId(ticketId);

  const currentUserId = ctx.from?.id!;
  const conversationData = await conversationModel.get(conversationId);
  const rawConversation = await decryptPayload(ticketId, conversationData!);
  const parentConversation: Conversation = JSON.parse(rawConversation);

  if (parentConversation) {
    let blockList = await userBlockListModel.get(currentUserId.toString());
    if (blockList && blockList[parentConversation.from.toString()]) {
      delete blockList[parentConversation.from.toString()];
      await userBlockListModel.save(currentUserId.toString(), blockList);
      await ctx.reply(USER_UNBLOCKED_MESSAGE);

      const replyKeyboard = createReplyKeyboard(ticketId, false);
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
  } else {
    await ctx.reply(HuhMessage);
  }

  await ctx.answerCallbackQuery();
};
