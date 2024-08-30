/**
 * Interface representing a User in the system.
 */
export interface User {
  userName: string;
  userUUID: string;
  blockList: number[];
  currentConversation?: {
    to?: number;
    reply_to_message_id?: number;
  };
  inbox: {
    timestamp: string;
    ticketId: string;
  }[];
}
/**
 * Interface representing a Conversation between two users.
 */
export interface Conversation {
  from: number;
  to: number;
  reply_to_message_id: number;
  message_type?: string;
  message_text?: string;
  photo_id?: string;
  video_id?: string;
  animation_id?: string;
  document_id?: string;
  sticker_id?: string;
  voice_id?: string;
  video_note_id?: string;
  audio_id?: string;
  caption?: string;
}

/**
 * Interface representing the Environment variables used in the bot.
 */
export interface Environment {
  SECRET_TELEGRAM_API_TOKEN: string;
  NekonymousKV: KVNamespace;
  nekonymousr2: R2Bucket;
  BOT_INFO: string;
  BOT_NAME: string;
  APP_SECURE_KEY: string;
}

/**
 * Log entry structure.
 */
export interface LogEntry {
  action: string;
  timestamp: string; // ISO formatted date string
  details?: any; // Any additional details to store with the log
}

/**
 * Handler
 */
export type Handler = (
  request: Request,
  env: Record<string, any>, // Updated to a more specific type
  ctx: ExecutionContext
) => Response | Promise<Response>;
