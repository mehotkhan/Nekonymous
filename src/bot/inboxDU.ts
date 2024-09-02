import { DurableObject, DurableObjectState } from "cloudflare:workers";
import { InboxMessage } from "../types";

/**
 * InboxDurableObject class handles the storage and retrieval of inbox messages
 * for a specific user. Each instance of this class corresponds to a unique inbox
 * identified by the Durable Object ID.
 */
export class InboxDurableObject implements DurableObject {
  private state: DurableObjectState;

  /**
   * Constructor initializes the Durable Object's state.
   *
   * @param state - The state object provided by Cloudflare's Durable Object runtime.
   * @param env - The environment object, typically containing bindings to external resources.
   */
  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  /**
   * Handles incoming HTTP requests and routes them based on the method and URL path.
   * Supports adding a message, retrieving the message count, and fetching/clearing the inbox.
   *
   * @param request - The incoming HTTP request.
   * @returns A Response object representing the result of the operation.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;

    switch (method) {
      case "POST":
        if (url.pathname === "/add") {
          return this.addMessage(request);
        }
        break;
      case "GET":
        if (url.pathname === "/counter") {
          return this.getMessageCount();
        } else if (url.pathname === "/retrieve") {
          return this.retrieveAndClearInbox();
        }
        break;
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * Adds a message to the user's inbox.
   *
   * @param request - The incoming HTTP request containing the message data in JSON format.
   * @returns A Response indicating the result of the operation.
   */
  private async addMessage(request: Request): Promise<Response> {
    const { timestamp, ticketId } = await request.json<InboxMessage>();
    const inbox = (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
    inbox.push({ timestamp, ticketId });
    await this.state.storage.put("inbox", inbox);
    return new Response("Message added to inbox", { status: 200 });
  }

  /**
   * Retrieves the current count of messages in the inbox.
   *
   * @returns A Response containing the count of messages in the inbox as JSON.
   */
  private async getMessageCount(): Promise<Response> {
    const inbox = (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
    return new Response(JSON.stringify(inbox), { status: 200 });
  }

  /**
   * Retrieves and clears the user's inbox.
   * After the inbox is retrieved, it is deleted from the storage.
   *
   * @returns A Response containing the inbox messages as JSON.
   */
  private async retrieveAndClearInbox(): Promise<Response> {
    const inbox = (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
    await this.state.storage.delete("inbox");
    return new Response(JSON.stringify(inbox), { status: 200 });
  }
}
