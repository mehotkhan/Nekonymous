export type Handler = (
  request: Request,
  env: any,
  ctx: ExecutionContext
) => Response | Promise<Response>;

export class Router {
  private routes: { method: string; path: RegExp; handler: Handler }[] = [];

  // Register a GET route
  get(path: string, handler: Handler): void {
    this.addRoute("GET", path, handler);
  }

  // Register a POST route
  post(path: string, handler: Handler): void {
    this.addRoute("POST", path, handler);
  }

  // Register a route with any HTTP method
  addRoute(method: string, path: string, handler: Handler): void {
    const pathRegex = new RegExp(`^${path.replace(/:[^\s/]+/g, "([\\w-]+)")}$`);
    this.routes.push({ method, path: pathRegex, handler });
  }

  // Handle incoming requests
  async handle(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    for (const route of this.routes) {
      const match = pathname.match(route.path);
      if (match && method === route.method) {
        return route.handler(request, env, ctx);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
