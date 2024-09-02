import { Handler } from "../types";

/**
 * A simple Router class to handle HTTP routes in a Cloudflare Worker environment.
 */
export class Router {
  // Array to store registered routes
  private routes: { method: string; path: RegExp; handler: Handler }[] = [];

  /**
   * Registers a GET route with the router.
   * @param path The path for the route, with optional parameters.
   * @param handler The handler function that processes the request.
   */
  get(path: string, handler: Handler): void {
    this.addRoute("GET", path, handler);
  }

  /**
   * Registers a POST route with the router.
   * @param path The path for the route, with optional parameters.
   * @param handler The handler function that processes the request.
   */
  post(path: string, handler: Handler): void {
    this.addRoute("POST", path, handler);
  }

  /**
   * Registers a route with the router for a specific HTTP method.
   * @param method The HTTP method (GET, POST, etc.).
   * @param path The path for the route, with optional parameters.
   * @param handler The handler function that processes the request.
   */
  addRoute(method: string, path: string, handler: Handler): void {
    // Convert the path to a regular expression, replacing parameter placeholders with capture groups
    const pathRegex = new RegExp(`^${path.replace(/:[^\s/]+/g, "([\\w-]+)")}$`);
    this.routes.push({ method, path: pathRegex, handler });
  }

  /**
   * Handles incoming requests by matching them to the registered routes.
   * @param request The incoming Request object.
   * @param env The environment bindings (e.g., KV namespaces, secrets).
   * @param ctx The execution context, used for handling background tasks.
   * @returns A Response object, or a Promise that resolves to a Response.
   */
  async handle(
    request: Request,
    env: Record<string, any>, // Updated to a more specific type
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Iterate through the registered routes to find a match
    for (const route of this.routes) {
      const match = pathname.match(route.path);
      if (match && method === route.method) {
        // Pass the matched parameters to the handler
        const params = match.slice(1);
        return this.safeHandle(route.handler, request, env, ctx, params);
      }
    }

    // Return 404 if no route matches
    return new Response("Not Found", { status: 404 });
  }

  /**
   * Safely handles a request by sanitizing input parameters to prevent XSS attacks.
   * @param handler The route handler function.
   * @param request The incoming Request object.
   * @param env The environment bindings.
   * @param ctx The execution context.
   * @param params The matched route parameters.
   * @returns A Response object or a Promise that resolves to a Response.
   */
  private async safeHandle(
    handler: Handler,
    request: Request,
    env: Record<string, any>,
    ctx: ExecutionContext,
    params: string[]
  ): Promise<Response> {
    // Sanitize the params to prevent XSS
    const sanitizedParams = params.map(this.sanitizeInput);
    return handler(request, env, ctx, ...sanitizedParams);
  }

  /**
   * Sanitizes input to prevent XSS attacks.
   * @param input The input string to sanitize.
   * @returns The sanitized string.
   */
  private sanitizeInput(input: string): string {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
