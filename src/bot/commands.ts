import { DurableObjectNamespace } from "@cloudflare/workers-types"; // Ensure your environment is set up correctly
import { Context } from "grammy";
import { WebUUID } from "web-uuid";
import { Conversation, User } from "../types";
import {
  createReplyKeyboard,
  handleMenuCommand,
  mainMenu,
} from "../utils/constant";
import { KVModel } from "../utils/kv-storage";
import { incrementStat } from "../utils/logs";
import {
  EMPTY_INBOX_MESSAGE,
  HuhMessage,
  MESSAGE_SENT_MESSAGE,
  NEW_INBOX_MESSAGE,
  NoUserFoundMessage,
  StartConversationMessage,
  USER_IS_BLOCKED_MESSAGE,
  WelcomeMessage,
} from "../utils/messages";
import { sendDecryptedMessage } from "../utils/messageSender";
import {
  decryptPayload,
  encryptedPayload,
  generateTicketId,
  getConversationId,
} from "../utils/ticket";

/**
 * Handles the /start command to initiate or continue a user's interaction with the bot.
 * It generates a unique UUID for new users and continues the interaction for existing users.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} userUUIDtoId - KVModel instance for managing UUID to user ID mapping.
 * @param {KVModel<number>} statsModel - KVModel instance for storing stats.
 * @param {DurableObjectNamespace} inboxNamespace - Durable Object Namespace for inbox handling.
 */
export const handleStartCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  userUUIDtoId: KVModel<string>,
  statsModel: KVModel<number>
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
          userName: ctx.from?.first_name ?? "بدون نام!",
          blockList: [],
          currentConversation: {},
        });
        await incrementStat(statsModel, "newUser"); // Increment the reply stat
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
      await ctx.reply(HuhMessage + JSON.stringify(error), {
        reply_markup: mainMenu,
      });
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
        StartConversationMessage.replace("USER_NAME", otherUser.userName!)
      );
    } else {
      await ctx.reply(NoUserFoundMessage);
    }
  } else {
    await ctx.reply(HuhMessage, {
      reply_markup: mainMenu,
    });
  }
};

/**
 * Handles all incoming messages that are not menu commands, routing them based on the user's current conversation state.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing conversation data.
 * @param {DurableObjectNamespace} inboxNamespace - Durable Object Namespace for inbox handling.
 * @param {KVModel<number>} statsModel - KVModel instance for storing stats.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */
export const handleMessage = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  inboxNamespace: DurableObjectNamespace,
  statsModel: KVModel<number>,
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
    return;
  }

  try {
    const ticketId = generateTicketId(APP_SECURE_KEY);

    const conversation: Conversation = {
      connection: {
        from: currentUserId,
        to: currentUser.currentConversation.to,
        reply_to_message_id:
          currentUser.currentConversation.reply_to_message_id!,
      },
      payload: {},
    };

    if (ctx.message?.text) {
      conversation.payload.message_text = ctx.message.text;
      conversation.payload.message_type = "text";
    } else if (ctx.message?.photo) {
      conversation.payload.message_type = "photo";
      conversation.payload.photo_id =
        ctx.message.photo[ctx.message.photo.length - 1].file_id;
      if (ctx.message.caption)
        conversation.payload.caption = ctx.message.caption;
    } else if (ctx.message?.video) {
      conversation.payload.message_type = "video";
      conversation.payload.video_id = ctx.message.video.file_id;
      if (ctx.message.caption)
        conversation.payload.caption = ctx.message.caption;
    } else if (ctx.message?.animation) {
      conversation.payload.message_type = "animation";
      conversation.payload.animation_id = ctx.message.animation.file_id;
      if (ctx.message.caption)
        conversation.payload.caption = ctx.message.caption;
    } else if (ctx.message?.document) {
      conversation.payload.message_type = "document";
      conversation.payload.document_id = ctx.message.document.file_id;
      if (ctx.message.caption)
        conversation.payload.caption = ctx.message.caption;
    } else if (ctx.message?.sticker) {
      conversation.payload.message_type = "sticker";
      conversation.payload.sticker_id = ctx.message.sticker.file_id;
    } else if (ctx.message?.voice) {
      conversation.payload.message_type = "voice";
      conversation.payload.voice_id = ctx.message.voice.file_id;
    } else if (ctx.message?.video_note) {
      conversation.payload.message_type = "video_note";
      conversation.payload.video_note_id = ctx.message.video_note.file_id;
    } else if (ctx.message?.audio) {
      conversation.payload.message_type = "audio";
      conversation.payload.audio_id = ctx.message.audio.file_id;
    }

    const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
    const conversationData = await encryptedPayload(
      ticketId,
      JSON.stringify(conversation),
      APP_SECURE_KEY
    );

    // Store the encrypted conversation in KV
    await conversationModel.save(conversationId, conversationData);

    // Interact with Durable Object for inbox management
    const inboxId = inboxNamespace.idFromString(
      currentUser.currentConversation.to.toString()
    );
    console.log("start", inboxId);
    const inboxObject = inboxNamespace.get(inboxId);
    console.log("inboxObject", inboxObject);

    await inboxObject.fetch(
      new Request("https://inbox/add", {
        method: "POST",
        body: JSON.stringify({ timestamp: Date.now(), ticketId }),
      })
    );
    // Clear current conversation for the user
    await userModel.updateField(
      currentUserId.toString(),
      "currentConversation",
      undefined
    );

    // Notify the user
    await ctx.reply(MESSAGE_SENT_MESSAGE);
    await ctx.api.sendMessage(
      currentUser.currentConversation.to,
      NEW_INBOX_MESSAGE
    );

    await incrementStat(statsModel, "newConversation"); // Increment the reply stat
  } catch (error) {
    await ctx.reply(HuhMessage + JSON.stringify(error), {
      reply_markup: mainMenu,
    });
  }
};

/**
 * Handles the /inbox command, retrieving and displaying messages from the user's inbox.
 *
 * @param {Context} ctx - The context of the current Telegram update.
 * @param {KVModel<User>} userModel - KVModel instance for managing user data.
 * @param {KVModel<string>} conversationModel - KVModel instance for managing conversation data.
 * @param {DurableObjectNamespace} inboxNamespace - Durable Object Namespace for inbox handling.
 * @param {string} APP_SECURE_KEY - The application-specific secure key.
 */

export const handleInboxCommand = async (
  ctx: Context,
  userModel: KVModel<User>,
  conversationModel: KVModel<string>,
  inboxNamespace: DurableObjectNamespace,
  APP_SECURE_KEY: string
): Promise<void> => {
  const currentUserId = ctx.from?.id!;

  try {
    // Fetch the Durable Object associated with this user's inbox
    const inboxId = inboxNamespace.idFromString(currentUserId.toString());
    const inboxObject = inboxNamespace.get(inboxId);

    const response = await inboxObject.fetch(new Request("https://inbox/get"));
    const inbox = await response.json();

    if (inbox.items.length > 0) {
      for (const { ticketId, timestamp } of inbox.items) {
        try {
          const conversationId = getConversationId(ticketId, APP_SECURE_KEY);
          const conversationData = await conversationModel.get(conversationId);
          const decryptedMessage: Conversation = JSON.parse(
            await decryptPayload(ticketId, conversationData!, APP_SECURE_KEY)
          );

          const otherUser = await userModel.get(
            decryptedMessage.connection.from.toString()
          );
          const isBlocked = !!otherUser?.blockList.some(
            (item: number) => item === currentUserId
          );

          const replyOptions: any = {
            reply_markup: createReplyKeyboard(ticketId, isBlocked),
          };

          if (decryptedMessage.connection.reply_to_message_id) {
            replyOptions.reply_to_message_id =
              decryptedMessage.connection.reply_to_message_id;
          }

          await sendDecryptedMessage(ctx, decryptedMessage, replyOptions);

          // Clear payload data in the conversation to minimize storage
          const clearedConversation = {
            connection: decryptedMessage.connection,
            payload: {}, // Clear the payload after sending the message
          };
          const clearedConversationData = await encryptedPayload(
            ticketId,
            JSON.stringify(clearedConversation),
            APP_SECURE_KEY
          );
          await conversationModel.save(conversationId, clearedConversationData);
        } catch (error) {
          await ctx.reply(HuhMessage + JSON.stringify(error), {
            reply_markup: mainMenu,
          });
        }
      }

      // Clear the inbox in the Durable Object after processing
      await inboxObject.fetch(
        new Request("https://inbox.clear", { method: "POST" })
      );
    } else {
      await ctx.reply(EMPTY_INBOX_MESSAGE, {
        reply_markup: mainMenu,
      });
    }
  } catch (error) {
    await ctx.reply(HuhMessage + JSON.stringify(error), {
      reply_markup: mainMenu,
    });
  }
};
