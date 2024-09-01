export class InboxDurableObject {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const method = request.method;

    switch (url.pathname) {
      case "/inbox/add":
        if (method === "POST") {
          return await this.addMessageToInbox(request);
        }
        break;

      case "/inbox/get":
        if (method === "GET") {
          return await this.retrieveAndClearInbox();
        }
        break;

      default:
        return new Response("Not Found", { status: 404 });
    }
  }

  /**
   * Adds a message to the inbox.
   *
   * @param request - The incoming request containing the message data.
   * @returns {Promise<Response>} - A response indicating the status of the operation.
   */
  private async addMessageToInbox(request: Request): Promise<Response> {
    const { timestamp, ticketId } = await request.json();
    const inbox = (await this.state.storage.get<any[]>("inbox")) || [];
    inbox.push({ timestamp, ticketId });
    await this.state.storage.put("inbox", inbox);
    return new Response("Message added to inbox", { status: 200 });
  }

  /**
   * Retrieves the messages from the inbox and clears the inbox afterwards.
   *
   * @returns {Promise<Response>} - A response containing the inbox messages.
   */
  private async retrieveAndClearInbox(): Promise<Response> {
    const inbox = (await this.state.storage.get<any[]>("inbox")) || [];
    await this.state.storage.delete("inbox"); // Clear the inbox after retrieval
    return new Response(JSON.stringify(inbox), { status: 200 });
  }
}
