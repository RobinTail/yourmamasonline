declare module 'fast-memory-cache' {
  class MemoryCache {
    public constructor();
    public get(key: string): any;
    public set(key: string, value: any, expireTime?: number): void;
    public delete(key: string): void;
    public clear(): void;
  }
  export = MemoryCache;
}
