declare const createModule: (options?: {
  locateFile?: (name: string) => string;
}) => Promise<unknown>;

export default createModule;