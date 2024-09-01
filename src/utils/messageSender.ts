import { Context } from "grammy";
import { escapeMarkdownV2 } from "./tools";
import { UnsupportedMessageTypeMessage } from "./messages";

export const sendDecryptedMessage = async (
  ctx: Context,
  decryptedMessage: any,
  replyOptions: any
): Promise<void> => {
  switch (decryptedMessage.payload.message_type) {
    case "text":
      await ctx.reply(decryptedMessage.payload.message_text, replyOptions);
      break;
    case "photo":
      await ctx.api.sendPhoto(
        ctx.chat?.id!,
        decryptedMessage.payload.photo_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case "video":
      await ctx.api.sendVideo(
        ctx.chat?.id!,
        decryptedMessage.payload.video_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case "animation":
      await ctx.api.sendAnimation(
        ctx.chat?.id!,
        decryptedMessage.payload.animation_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case "document":
      await ctx.api.sendDocument(
        ctx.chat?.id!,
        decryptedMessage.payload.document_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case "sticker":
      await ctx.api.sendSticker(
        ctx.chat?.id!,
        decryptedMessage.payload.sticker_id,
        replyOptions
      );
      break;
    case "voice":
      await ctx.api.sendVoice(
        ctx.chat?.id!,
        decryptedMessage.payload.voice_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    case "video_note":
      await ctx.api.sendVideoNote(
        ctx.chat?.id!,
        decryptedMessage.payload.video_note_id,
        replyOptions
      );
      break;
    case "audio":
      await ctx.api.sendAudio(
        ctx.chat?.id!,
        decryptedMessage.payload.audio_id,
        {
          ...replyOptions,
          caption: decryptedMessage.payload.caption
            ? escapeMarkdownV2(decryptedMessage.payload.caption)
            : undefined,
          parse_mode: "MarkdownV2",
        }
      );
      break;
    default:
      await ctx.reply(UnsupportedMessageTypeMessage, replyOptions);
      break;
  }
};
