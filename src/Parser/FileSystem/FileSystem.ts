
export type AbsolutePath = `/${string}`;
export type FileReader = (path: string) => Promise<string>;

export type FileSystem = {
  getPath: () => AbsolutePath,
  setPath: (directory: string) => void,
  resolve: (path: string) => AbsolutePath,
  readFile: FileReader,
};