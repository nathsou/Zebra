import { AbsolutePath, FileSystem } from "./FileSystem";

const isAbsolute = (path: string): path is AbsolutePath => path.startsWith('/');

export type Files = Record<AbsolutePath, string>;

export const createVirtualFileSystem = (initialPath: AbsolutePath, files: Files): FileSystem & {
  addFile: (path: AbsolutePath, contents: string) => void
} => {
  let path = initialPath;

  const dirname = (path: AbsolutePath): AbsolutePath => {
    const parts = (path.startsWith('/') ? path.slice(1) : path).split('/');
    if (!path.endsWith('/')) {
      parts.pop();
    }

    return `/${parts.join('/')}`;
  };

  return {
    getPath: () => path,
    setPath: newPath => {
      if (!isAbsolute(newPath)) {
        throw new Error(`called setPath with a relative path: ${newPath}`);
      }

      path = newPath;
    },
    readFile: async (path: string) => {
      if (path in files && isAbsolute(path)) {
        return files[path];
      }

      throw new Error(`Unknown file: ${path}`);
    },
    resolve: (p: string): AbsolutePath => {
      if (isAbsolute(p)) {
        return p;
      }

      const parts: string[] = [];

      for (const part of `${dirname(path).slice(1)}/${p}`.split('/')) {
        if (part === '..') {
          parts.pop();
        } else if (part === '.') {
          // do nothing
        } else {
          parts.push(part);
        }
      }

      return `/${parts.join('/')}`;
    },
    addFile: (path: AbsolutePath, contents: string): void => {
      files[path] = contents;
    },
  };
};