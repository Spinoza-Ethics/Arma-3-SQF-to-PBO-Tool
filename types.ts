
export interface SQFFile {
  name: string;
  content: string;
  type: 'function' | 'init' | 'postInit';
  functionName?: string;
}

export interface ModConfig {
  name: string;
  tag: string;
  author: string;
  version: string;
  description: string;
}

export interface ModPackage {
  config: ModConfig;
  files: SQFFile[];
}
