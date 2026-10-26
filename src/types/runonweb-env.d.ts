// Ambient definitions for runonweb TypeScript source files
interface GPUAdapter {
  features?: {
    has(feature: string): boolean;
  };
}

interface GPU {
  requestAdapter(options?: unknown): Promise<GPUAdapter | null>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WorkerGlobalScope: any;
