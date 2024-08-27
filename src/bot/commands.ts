import { Context, Keyboard } from "grammy";
import { WebUUID } from "web-uuid";
import { BlockList, CurrentConversation, User } from "../types";
import { KVModel } from "../utils/kv-storage";
import Logger from "../utils/logs"; // Import Logger class
import {
  ABOUT_PRIVACY_COMMAND_MESSAGE,
  DELETE_USER_COMMAND_MESSAGE,
  HuhMessage,
  MESSAGE_SENT_MESSAGE,
  NoUserFoundMessage,
  SETTINGS_COMMAND_MESSAGE,
  StartConversationMessage,
  UnsupportedMessageTypeMessage,
  USER_IS_BLOCKED_MESSAGE,
  USER_LINK_MESSAGE,
  WelcomeMessage,
} from "../utils/messages";
import {
  encryptedPayload,
  generateTicketId,
  getConversationId,
} from "../utils/ticket";
import { escapeMarkdownV2 } from "../utils/tools";
import { createReplyKeyboard } from "./actions";

// Main menu keyboard used across various commands
const mainMenu = new Keyboard()
  .text("تنظیمات")
  .text("دریافت لینک")
  .row()
  .text("درباره")
  .text("درباره و حریم خصوصی")
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
  currentConversationModel: KVModel<CurrentConversation>,
  logger: Logger // Pass the Logger instance
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
        `https://t.me/nekonymous_bot?start=${currentUserUUID}`
      ),
      {
        reply_markup: mainMenu,
      }
    );
    // Log the new user action
    await logger.saveLog("new_user", {});
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
      await ctx.reply(NoUserFoundMessage);
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
          `https://t.me/nekonymous_bot?start=${currentUserUUID}`
        ),
        {
          reply_markup: mainMenu,
        }
      );
      break;

    case "تنظیمات":
      await ctx.reply(SETTINGS_COMMAND_MESSAGE);
      break;

    case "درباره و حریم خصوصی":
      await ctx.reply(ABOUT_PRIVACY_COMMAND_MESSAGE);
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

  if (!currentConversation) {
    // If no conversation is active, respond with a generic error message
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
    return;
  }

  try {
    const ticketId = generateTicketId();
    const blockList =
      (await userBlockListModel.get(currentConversation.to.toString())) || {};
    const isBlocked = !!blockList[currentUserId];

    const replyOptions: any = {
      reply_markup: createReplyKeyboard(ticketId, isBlocked),
    };

    // Conditionally add the reply_to_message_id parameter if reply_to_message_id exists
    if (currentConversation.reply_to_message_id) {
      replyOptions.reply_to_message_id =
        currentConversation.reply_to_message_id;
    }

    if (ctx.message?.text) {
      // Handle text messages with MarkdownV2 spoilers
      await ctx.api.sendMessage(
        currentConversation.to,
        escapeMarkdownV2(ctx.message.text),
        {
          parse_mode: "MarkdownV2",
          ...replyOptions,
        }
      );
    } else if (ctx.message?.photo) {
      // Handle photo messages with an optional caption
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      await ctx.api.sendPhoto(currentConversation.to, photo.file_id, {
        ...replyOptions,
        caption: ctx.message.caption
          ? escapeMarkdownV2(ctx.message.caption)
          : undefined,
        parse_mode: "MarkdownV2",
      });
    } else if (ctx.message?.video) {
      // Handle video messages with an optional caption
      await ctx.api.sendVideo(
        currentConversation.to,
        ctx.message.video.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
    } else if (ctx.message?.animation) {
      await ctx.api.sendAnimation(
        currentConversation.to,
        ctx.message.animation.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
    } else if (ctx.message?.document) {
      // Handle file/document messages with an optional caption
      await ctx.api.sendDocument(
        currentConversation.to,
        ctx.message.document.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
    } else if (ctx.message?.sticker) {
      // Handle sticker messages
      await ctx.api.sendSticker(
        currentConversation.to,
        ctx.message.sticker.file_id,
        replyOptions
      );
    } else if (ctx.message?.voice) {
      // Handle voice messages
      await ctx.api.sendVoice(
        currentConversation.to,
        ctx.message.voice.file_id,
        replyOptions
      );
    } else if (ctx.message?.video_note) {
      // Handle video note messages
      await ctx.api.sendVideoNote(
        currentConversation.to,
        ctx.message.video_note.file_id,
        replyOptions
      );
    } else if (ctx.message?.audio) {
      // Handle audio messages
      await ctx.api.sendAudio(
        currentConversation.to,
        ctx.message.audio.file_id,
        replyOptions
      );
    } else {
      // If the message type is not recognized, respond with an error message or handle accordingly
      await ctx.reply(UnsupportedMessageTypeMessage, replyOptions);
    }

    await ctx.reply(MESSAGE_SENT_MESSAGE);

    const conversationId = getConversationId(ticketId);
    const conversationData = await encryptedPayload(
      ticketId,
      JSON.stringify({
        from: currentUserId,
        to: currentConversation.to,
        reply_to_message_id: ctx.message?.message_id,
      })
    );
    await conversationModel.save(conversationId, conversationData);
    await currentConversationModel.delete(currentUserId.toString());
  } catch (error) {
    await ctx.reply(HuhMessage + "\n" + JSON.stringify(error), {
      reply_markup: mainMenu,
    });
  }
};

/**
 * Handles the /deleteAccount command to remove a user's data from the bot's storage.
 *
 * This function deletes the user's record, UUID mapping, and any other associated data,
 * effectively removing them from the bot's system.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} userIdToUUID - KVModel instance for mapping user IDs to UUIDs.
 * @param {Logger} logger - Logger instance for saving logs to R2.
 */
export const handleDeleteUserCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  userIdToUUID: KVModel<string>,
  logger: Logger
): Promise<void> => {
  const currentUserId = ctx.from?.id!;
  const currentUserUUID = await userIdToUUID.get(currentUserId.toString());

  if (currentUserUUID) {
    await userModel.delete(currentUserUUID);
    await userIdToUUID.delete(currentUserId.toString());

    // Log the delete user action
    await logger.saveLog("delete_user", {});

    await ctx.reply(DELETE_USER_COMMAND_MESSAGE, {
      reply_markup: mainMenu,
    });
  } else {
    await ctx.reply(NoUserFoundMessage);
  }
};
