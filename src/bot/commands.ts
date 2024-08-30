import { Context, Keyboard } from "grammy";
import { WebUUID } from "web-uuid";
import { Conversation, User } from "../types";
import { KVModel } from "../utils/kv-storage";
import Logger from "../utils/logs";
import {
  ABOUT_PRIVACY_COMMAND_MESSAGE,
  EMPTY_INBOX_MESSAGE,
  HuhMessage,
  MESSAGE_SENT_MESSAGE,
  NEW_INBOX_MESSAGE,
  NoUserFoundMessage,
  StartConversationMessage,
  UnsupportedMessageTypeMessage,
  USER_IS_BLOCKED_MESSAGE,
  USER_LINK_MESSAGE,
  WelcomeMessage,
} from "../utils/messages";
import {
  decryptPayload,
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
          inbox: [],
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

    const conversation: Conversation = {
      from: currentUserId,
      to: currentUser.currentConversation.to,
      reply_to_message_id: currentUser.currentConversation.reply_to_message_id,
      reply_to_message_id_2: ctx.message?.message_id!,
    };
 
    if (ctx.message?.text) {
      conversation.message_text = ctx.message.text;
      conversation.message_type = "text";
    } else if (ctx.message?.photo) {
      conversation.message_type = "photo";
      conversation.photo_id =
        ctx.message.photo[ctx.message.photo.length - 1].file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.video) {
      conversation.message_type = "video";
      conversation.video_id = ctx.message.video.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.animation) {
      conversation.message_type = "animation";
      conversation.animation_id = ctx.message.animation.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.document) {
      conversation.message_type = "document";
      conversation.document_id = ctx.message.document.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.sticker) {
      conversation.message_type = "sticker";
      conversation.sticker_id = ctx.message.sticker.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.voice) {
      conversation.message_type = "voice";
      conversation.voice_id = ctx.message.voice.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.video_note) {
      conversation.message_type = "video_note";
      conversation.video_note_id = ctx.message.video_note.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    } else if (ctx.message?.audio) {
      conversation.message_type = "audio";
      conversation.audio_id = ctx.message.audio.file_id;
      if (ctx.message.caption) conversation.caption = ctx.message.caption;
    }

    await ctx.reply(MESSAGE_SENT_MESSAGE);
    await logger.saveLog("new_conversation_success", {});

    const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
    const conversationData = await encryptedPayload(
      ticketId,
      JSON.stringify(conversation),
      APP_SECURE_KEY
    );

    await userModel.updateField(
      currentUser.currentConversation.to.toString(),
      "inbox",
      { timestamp: new Date().toISOString(), ticketId },
      true
    );

    await conversationModel.save(conversationId, conversationData);
    await userModel.updateField(
      currentUserId.toString(),
      "currentConversation",
      undefined
    );
    await ctx.api.sendMessage(
      currentUser.currentConversation.to,
      NEW_INBOX_MESSAGE
    );
  } catch (error) {
    await ctx.reply(HuhMessage + JSON.stringify(error), {
      reply_markup: mainMenu,
    });
    await logger.saveLog("new_conversation_unknown", error);
  }
};

/**
 * Handles the /inbox command, retrieving and displaying messages from the user's inbox.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing conversation data.
 * @param {Logger} logger - Logger instancefor saving logs.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleInboxCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  logger: Logger,
  APP_SECURE_KEY: string
): Promise<void> => {
  const currentUserId = ctx.from?.id!;
  const currentUser = await userModel.get(currentUserId.toString());

  const inbox = currentUser?.inbox ?? [];
  if (inbox.length > 0) {
    for (const { ticketId, timestamp } of inbox) {
      try {
        const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
        const conversationData = await conversationModel.get(conversationId);
        const decryptedMessage = JSON.parse(
          await decryptPayload(ticketId, conversationData!, APP_SECURE_KEY)
        );

        const otherUser = await userModel.get(decryptedMessage.from.toString());
        const isBlocked = !!otherUser?.blockList.some(
          (item: number) => item === currentUserId
        );

        const replyOptions: any = {
          reply_markup: createReplyKeyboard(ticketId, isBlocked),
        };
        // Conditionally add the reply_to_message_id parameter if reply_to_message_id exists
        if (decryptedMessage.reply_to_message_id) {
          replyOptions.reply_to_message_id =
            decryptedMessage.reply_to_message_id;
        }
        switch (decryptedMessage.message_type) {
        case "text":
          await ctx.reply(decryptedMessage.message_text, replyOptions);
          break;
        case "photo":
          await ctx.api.sendPhoto(ctx.chat?.id!, decryptedMessage.photo_id, {
            ...replyOptions,
            caption: decryptedMessage.caption
              ? escapeMarkdownV2(decryptedMessage.caption)
              : undefined,
            parse_mode: "MarkdownV2",
          });

          break;
        case "video":
          await ctx.api.sendVideo(ctx.chat?.id!, decryptedMessage.video_id, {
            ...replyOptions,
            caption: decryptedMessage.caption
              ? escapeMarkdownV2(decryptedMessage.caption)
              : undefined,
            parse_mode: "MarkdownV2",
          });

          break;
        case "animation":
          await ctx.api.sendAnimation(
              ctx.chat?.id!,
              decryptedMessage.animation_id,
              {
                ...replyOptions,
                caption: decryptedMessage.caption
                  ? escapeMarkdownV2(decryptedMessage.caption)
                  : undefined,
                parse_mode: "MarkdownV2",
              }
          );

          break;
        case "document":
          await ctx.api.sendDocument(
              ctx.chat?.id!,
              decryptedMessage.document_id,
              {
                ...replyOptions,
                caption: decryptedMessage.caption
                  ? escapeMarkdownV2(decryptedMessage.caption)
                  : undefined,
                parse_mode: "MarkdownV2",
              }
          );

          break;
        case "sticker":
          await ctx.api.sendSticker(
              ctx.chat?.id!,
              decryptedMessage.sticker_id,
              {
                ...replyOptions,
                caption: decryptedMessage.caption
                  ? escapeMarkdownV2(decryptedMessage.caption)
                  : undefined,
                parse_mode: "MarkdownV2",
              }
          );
          break;

        case "voice":
          await ctx.api.sendVoice(ctx.chat?.id!, decryptedMessage.voice_id, {
            ...replyOptions,
            caption: decryptedMessage.caption
              ? escapeMarkdownV2(decryptedMessage.caption)
              : undefined,
            parse_mode: "MarkdownV2",
          });
          break;

        case "video_note":
          await ctx.api.sendVideoNote(
              ctx.chat?.id!,
              decryptedMessage.video_note_id,
              {
                ...replyOptions,
                caption: decryptedMessage.caption
                  ? escapeMarkdownV2(decryptedMessage.caption)
                  : undefined,
                parse_mode: "MarkdownV2",
              }
          );

          break;
        case "audio":
          await ctx.api.sendVideoNote(
              ctx.chat?.id!,
              decryptedMessage.audio_id,
              {
                ...replyOptions,
                caption: decryptedMessage.caption
                  ? escapeMarkdownV2(decryptedMessage.caption)
                  : undefined,
                parse_mode: "MarkdownV2",
              }
          );

          break;
        default:
          await ctx.reply(UnsupportedMessageTypeMessage, replyOptions);
          break;
        }

 
      } catch (error) {
        await logger.saveLog("inbox_message_processing_failed", {
          ticketId,
          error,
        });
      }
    }
    // Remove the processed ticket from inbox
    await userModel.updateField(
      currentUserId.toString(),
      "inbox",
      []
    );
  } else {
    await ctx.reply(EMPTY_INBOX_MESSAGE, {
      reply_markup: mainMenu,
    });
  }
};
