declare module "jexl" {
  interface JexlInstance {
    addFunction(name: string, fn: (...args: unknown[]) => unknown): void;
    addTransform(name: string, fn: (...args: unknown[]) => unknown): void;
    eval(expression: string, context?: Record<string, unknown>): Promise<unknown>;
  }
  const jexl: JexlInstance;
  export default jexl;
}
