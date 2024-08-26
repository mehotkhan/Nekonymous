import { Context, Keyboard } from "grammy";
import { KVModel } from "../utils/kv-storage";
import {
  ABOUT_COMMAND_MESSAGE,
  DELETE_USER_COMMAND_MESSAGE,
  HuhMessage,
  MESSAGE_SENT_MESSAGE,
  NoUserFoundMessage,
  PRIVACY_COMMAND_MESSAGE,
  SETTINGS_COMMAND_MESSAGE,
  StartConversationMessage,
  USER_IS_BLOCKED_MESSAGE,
  USER_LINK_MESSAGE,
  WelcomeMessage,
} from "../utils/messages";
import { WebUUID } from "web-uuid";
import {
  getConversationId,
  encryptedPayload,
  generateTicketId,
} from "../utils/ticket";
import { BlockList, CurrentConversation, User } from "../types";
import { createReplyKeyboard } from "./actions";
import { escapeMarkdownV2 } from "../utils/tools";

// Main menu keyboard used across various commands
const mainMenu = new Keyboard()
  .text("درباره")
  .text("دریافت لینک")
  .row()
  .text("تنظیمات")
  .text("حذف حساب")
  .text("حریم خصوصی")
  .resized();

/**
 * Handles the /start command to initiate or continue a user's interaction with the bot.
 *
 * This function manages the user's entry point into the bot's system. It handles new users by generating
 * a unique UUID and storing it in the KV store, or continues the interaction for existing users.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} userIdToUUID - KVModel instance for mapping user IDs to UUIDs.
 * @param {KVModel<BlockList>} userBlockListModel - KVModel instance for managing user block lists.
 * @param {KVModel<CurrentConversation>} currentConversationModel - KVModel instance for managing current conversations.
 */
export const handleStartCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  userIdToUUID: KVModel<string>,
  userBlockListModel: KVModel<BlockList>,
  currentConversationModel: KVModel<CurrentConversation>
): Promise<void> => {
  const currentUserId: number = ctx.from?.id!;
  let currentUserUUID = await userIdToUUID.get(currentUserId.toString());

  // New user: Generate UUID and save to KV storage
  if (!ctx.match) {
    if (!currentUserUUID) {
      currentUserUUID = new WebUUID().toString();
      await userIdToUUID.save(currentUserId.toString(), currentUserUUID);
      await userModel.save(currentUserUUID, {
        userId: currentUserId,
        userName: ctx.from?.first_name!,
      });
    }

    // Send welcome message with the user's unique bot link
    await ctx.reply(
      WelcomeMessage.replace(
        "UUID_USER_URL",
        `https://t.me/anonymous_gap_bot?start=${currentUserUUID}`
      ),
      {
        reply_markup: mainMenu,
      }
    );
  } else if (typeof ctx.match === "string") {
    // User initiated bot with another user's UUID (e.g., from a shared link)
    const otherUserUUID = ctx.match;
    const otherUser = await userModel.get(otherUserUUID);

    if (otherUser) {
      const blockList =
        (await userBlockListModel.get(otherUser.userId.toString())) || {};
      if (blockList[currentUserId]) {
        await ctx.reply(USER_IS_BLOCKED_MESSAGE);
        return;
      }

      // Establish conversation with the other user
      const conversation = {
        to: otherUser.userId,
        parent_message: ctx.message?.message_id!,
      };
      await currentConversationModel.save(
        currentUserId.toString(),
        conversation
      );
      await ctx.reply(
        StartConversationMessage.replace("USER_NAME", otherUser.userName)
      );
    } else {
      // No user found with the provided UUID
      await ctx.reply(
        NoUserFoundMessage + JSON.stringify(otherUserUUID, otherUser)
      );
    }
  } else {
    // Handle unexpected cases
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
  }
};

/**
 * Handles menu-related commands such as "دریافت لینک", "تنظیمات", "درباره", etc.
 *
 * This function manages the main menu commands available to the user.
 * It responds to specific commands by sending the appropriate message or performing the related action.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<string>} userIdToUUID - KVModel instance for mapping user IDs to UUIDs.
 * @returns {Promise<boolean>} - Returns true if a command was successfully handled, otherwise false.
 */
export const handleMenuCommand = async (
  ctx: Context,
  userIdToUUID: KVModel<string>
): Promise<boolean> => {
  const currentUserId = ctx.from?.id!;
  const msgPayload = ctx.message?.text;
  const currentUserUUID = await userIdToUUID.get(currentUserId.toString());

  switch (msgPayload) {
    case "دریافت لینک":
      await ctx.reply(
        USER_LINK_MESSAGE.replace(
          "UUID_USER_URL",
          `https://t.me/anonymous_gap_bot?start=${currentUserUUID}`
        ),
        {
          reply_markup: mainMenu,
        }
      );
      break;

    case "تنظیمات":
      await ctx.reply(SETTINGS_COMMAND_MESSAGE);
      break;

    case "درباره":
      await ctx.reply(ABOUT_COMMAND_MESSAGE);
      break;

    case "حریم خصوصی":
      await ctx.reply(PRIVACY_COMMAND_MESSAGE);
      break;

    case "حذف حساب":
      await ctx.reply(DELETE_USER_COMMAND_MESSAGE);
      break;

    default:
      return false; // Command not found in the menu
  }

  return true; // Command was handled
};

/**
 * Handles all incoming messages that are not menu commands.
 *
 * This function processes messages that don't correspond to menu commands, such as normal text messages or media.
 * It checks if the user is currently engaged in a conversation and routes the message accordingly.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<string>} userIdToUUID - KVModel instance for mapping user IDs to UUIDs.
 * @param {KVModel<BlockList>} userBlockListModel - KVModel instance for managing user block lists.
 * @param {KVModel<CurrentConversation>} currentConversationModel - KVModel instance for managing current conversations.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing encrypted conversation data.
 */
export const handleMessage = async (
  ctx: Context,
  userIdToUUID: KVModel<string>,
  userBlockListModel: KVModel<BlockList>,
  currentConversationModel: KVModel<CurrentConversation>,
  conversationModel: KVModel<string>
): Promise<void> => {
  const currentUserId = ctx.from?.id!;

  // First, check if the message is a menu command
  const isMenuCommandHandled = await handleMenuCommand(ctx, userIdToUUID);
  if (isMenuCommandHandled) {
    return; // If a menu command was handled, return early
  }

  const currentConversation = await currentConversationModel.get(
    currentUserId.toString()
  );

  if (currentConversation) {
    try {
      const ticketId = generateTicketId();
      const blockList =
        (await userBlockListModel.get(currentConversation.to.toString())) || {};
      const isBlocked = !!blockList[currentUserId];

      if (ctx.message?.text) {
        // Send the message to the intended recipient, wrapped in MarkdownV2 spoilers
        await ctx.api.sendMessage(
          currentConversation.to,
          `||${escapeMarkdownV2(ctx.message?.text)}||`,
          {
            reply_markup: createReplyKeyboard(ticketId, isBlocked),
            parse_mode: "MarkdownV2",
          }
        );
      } else {
        // Handle other media types similarly (e.g., photos, videos)
        // Logic for handling media can be added here
      }

      await ctx.reply(MESSAGE_SENT_MESSAGE);
      await currentConversationModel.delete(currentUserId.toString());

      const conversationId = getConversationId(ticketId);
      const conversationData = await encryptedPayload(
        ticketId,
        JSON.stringify({
          from: currentUserId,
          to: currentConversation.to,
        })
      );
      await conversationModel.save(conversationId, conversationData);
    } catch (error) {
      await ctx.reply(HuhMessage + "\n" + JSON.stringify(error), {
        reply_markup: mainMenu,
      });
    }
  } else {
    // If no conversation is active, respond with a generic error message
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
  }
};
