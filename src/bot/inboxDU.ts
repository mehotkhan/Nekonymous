import { DurableObject } from "cloudflare:workers";
import { InboxMessage } from "../types";

export class InboxDurableObject implements DurableObject {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;

    if (method === "POST" && url.pathname === "/add") {
      const { timestamp, ticketId } = await request.json<InboxMessage>();
      const inbox =
        (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
      inbox.push({ timestamp, ticketId });
      await this.state.storage.put("inbox", inbox);
      return new Response("Message added to inbox", { status: 200 });
    }
    if (method === "GET" && url.pathname === "/counter") {
      const inbox =
        (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
      return new Response(JSON.stringify(inbox), { status: 200 });
    }
    if (method === "GET" && url.pathname === "/retrieve") {
      const inbox =
        (await this.state.storage.get<InboxMessage[]>("inbox")) || [];
      await this.state.storage.delete("inbox");
      return new Response(JSON.stringify(inbox), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
}
