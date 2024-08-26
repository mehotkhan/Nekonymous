/**
 * Interface representing a User in the system.
 */
export interface User {
  userName: string;
  userId: number;
}

/**
 * Interface representing a Conversation between two users.
 */
export interface Conversation {
  from: number;
  to: number;
}

/**
 * Interface representing the CurrentConversation state of a user.
 * This tracks the current conversation a user is engaged in, along with the parent message ID.
 */
export interface CurrentConversation {
  to: number;
  parent_message: number;
}

/**
 * Interface representing a BlockList.
 * The key is a user ID (string) and the value is a boolean indicating if the user is blocked.
 */
export interface BlockList {
  [userId: string]: boolean;
}

/**
 * Interface representing the Environment variables used in the bot.
 */
export interface Environment {
  SECRET_TELEGRAM_API_TOKEN: string;
  anonymous_kv: KVNamespace;
  BOT_INFO: string;
  BOT_NAME: string;
}
