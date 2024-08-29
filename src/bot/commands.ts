import { Context, Keyboard } from "grammy";
import { WebUUID } from "web-uuid";
import { User } from "../types";
import { KVModel } from "../utils/kv-storage";
import Logger from "../utils/logs";
import {
  ABOUT_PRIVACY_COMMAND_MESSAGE,
  HuhMessage,
  MESSAGE_SENT_MESSAGE,
  NoUserFoundMessage,
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
  .text("درباره و حریم خصوصی")
  .text("دریافت لینک")
  .resized();

/**
 * Handles the /start command to initiate or continue a user's interaction with the bot.
 * It generates a unique UUID for new users and continues the interaction for existing users.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} userUUIDtoId - KVModel instance for managing UUID to user ID mapping.
 * @param {Logger} logger - Logger instance for saving logs.
 */
export const handleStartCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  userUUIDtoId: KVModel<string>,
  logger: Logger
): Promise<void> => {
  const currentUserId = ctx.from?.id!;

  if (!ctx.match) {
    try {
      let currentUserUUID = "";
      const currentUser = await userModel.get(currentUserId.toString());

      if (!currentUser) {
        currentUserUUID = new WebUUID().toString();
        await userUUIDtoId.save(currentUserUUID, currentUserId.toString());
        await userModel.save(currentUserId.toString(), {
          userUUID: currentUserUUID,
          userName: ctx.from?.first_name,
          blockList: [],
          currentConversation: {},
        });
        await logger.saveLog("new_user_success", {});
      } else {
        currentUserUUID = currentUser.userUUID;
      }

      await ctx.reply(
        WelcomeMessage.replace(
          "UUID_USER_URL",
          `https://t.me/nekonymous_bot?start=${currentUserUUID}`
        ),
        {
          reply_markup: mainMenu,
        }
      );
    } catch (error) {
      await logger.saveLog("new_user_failed", error);
    }
  } else if (typeof ctx.match === "string") {
    const otherUserUUID = ctx.match;
    const otherUserId = await userUUIDtoId.get(otherUserUUID);

    if (otherUserId) {
      const otherUser = await userModel.get(otherUserId);
      if (otherUser?.blockList.includes(currentUserId)) {
        await ctx.reply(USER_IS_BLOCKED_MESSAGE);
        return;
      }

      await userModel.updateField(
        currentUserId.toString(),
        "currentConversation",
        { to: otherUserId }
      );
      await ctx.reply(
        StartConversationMessage.replace("USER_NAME", otherUser.userName)
      );
      await logger.saveLog("new_conversation_success", {});
    } else {
      await logger.saveLog("new_conversation_failed", { NoUserFoundMessage });
      await ctx.reply(NoUserFoundMessage);
    }
  } else {
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
    await logger.saveLog("start_command_unknown", {});
  }
};

/**
 * Handles menu-related commands such as "دریافت لینک", "درباره", etc.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {string} userUUID - The UUID of the current user.
 * @returns {Promise<boolean>} - Returns true if a command was successfully handled, otherwise false.
 */
export const handleMenuCommand = async (
  ctx: Context,
  userUUID: string
): Promise<boolean> => {
  const msgPayload = ctx.message?.text;

  switch (msgPayload) {
  case "دریافت لینک":
    await ctx.reply(
      USER_LINK_MESSAGE.replace(
        "UUID_USER_URL",
        `https://t.me/nekonymous_bot?start=${userUUID}`
      ),
      {
        reply_markup: mainMenu,
      }
    );
    break;
  case "درباره و حریم خصوصی":
    await ctx.reply(escapeMarkdownV2(ABOUT_PRIVACY_COMMAND_MESSAGE), {
      reply_markup: mainMenu,
      parse_mode: "MarkdownV2",
    });
    break;
  default:
    return false;
  }

  return true;
};

/**
 * Handles all incoming messages that are not menu commands, routing them based on the user's current conversation state.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing conversation data.
 * @param {Logger} logger - Logger instance for saving logs.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleMessage = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  logger: Logger,
  APP_SECURE_KEY: string
): Promise<void> => {
  const currentUserId = ctx.from?.id!;
  const currentUser = await userModel.get(currentUserId.toString());

  const isMenuCommandHandled = await handleMenuCommand(
    ctx,
    currentUser?.userUUID || ""
  );
  if (isMenuCommandHandled) return;

  if (!currentUser?.currentConversation?.to) {
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
    await logger.saveLog("current_conversation_failed", {});
    return;
  }

  try {
    const ticketId = generateTicketId(APP_SECURE_KEY);
    const otherUser = await userModel.get(
      currentUser.currentConversation.to.toString()
    );
    const isBlocked =
      otherUser?.blockList.includes(currentUserId.toString()) || false;

    const replyOptions: any = {
      reply_markup: createReplyKeyboard(ticketId, isBlocked),
    };

    if (currentUser.currentConversation.reply_to_message_id) {
      replyOptions.reply_to_message_id =
        currentUser.currentConversation.reply_to_message_id;
    }

    switch (true) {
    case !!ctx.message?.text:
      await ctx.api.sendMessage(
        currentUser.currentConversation.to,
        escapeMarkdownV2(ctx.message.text!),
        {
          parse_mode: "MarkdownV2",
          ...replyOptions,
        }
      );
      break;
    case !!ctx.message?.photo:
      await ctx.api.sendPhoto(
        currentUser.currentConversation.to,
        ctx.message.photo[ctx.message.photo.length - 1].file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case !!ctx.message?.video:
      await ctx.api.sendVideo(
        currentUser.currentConversation.to,
        ctx.message.video.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case !!ctx.message?.animation:
      await ctx.api.sendAnimation(
        currentUser.currentConversation.to,
        ctx.message.animation.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case !!ctx.message?.document:
      await ctx.api.sendDocument(
        currentUser.currentConversation.to,
        ctx.message.document.file_id,
        {
          ...replyOptions,
          caption: ctx.message.caption
            ? escapeMarkdownV2(ctx.message.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case !!ctx.message?.sticker:
      await ctx.api.sendSticker(
        currentUser.currentConversation.to,
        ctx.message.sticker.file_id,
        replyOptions
      );
      break;
    case !!ctx.message?.voice:
      await ctx.api.sendVoice(
        currentUser.currentConversation.to,
        ctx.message.voice.file_id,
        replyOptions
      );
      break;
    case !!ctx.message?.video_note:
      await ctx.api.sendVideoNote(
        currentUser.currentConversation.to,
        ctx.message.video_note.file_id,
        replyOptions
      );
      break;
    case !!ctx.message?.audio:
      await ctx.api.sendAudio(
        currentUser.currentConversation.to,
        ctx.message.audio.file_id,
        replyOptions
      );
      break;
    default:
      await ctx.reply(UnsupportedMessageTypeMessage, replyOptions);
    }

    await ctx.reply(MESSAGE_SENT_MESSAGE);
    await logger.saveLog("new_conversation_success", {});

    const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
    const conversationData = await encryptedPayload(
      ticketId,
      JSON.stringify({
        from: currentUserId,
        to: currentUser.currentConversation.to,
        reply_to_message_id: ctx.message?.message_id,
      }),
      APP_SECURE_KEY
    );

    await conversationModel.save(conversationId, conversationData);
    await userModel.updateField(
      currentUserId.toString(),
      "currentConversation",
      undefined
    );
  } catch (error) {
    await ctx.reply(HuhMessage + JSON.stringify(error), {
      reply_markup: mainMenu,
    });
    await logger.saveLog("new_conversation_unknown", error);
  }
};
