declare module "pagedjs" {
  export class Previewer {
    preview(content: Node | string, stylesheets?: Array<string | Record<string, string>>, renderTo?: HTMLElement | null): Promise<{ total: number }>;
  }
}
