import { readFile } from "fs/promises";
import { relative, resolve } from "path";
import { dirname } from "path/posix";
import { chdir, cwd } from "process";
import { AbsolutePath, FileReader, FileSystem } from "./FileSystem";

export const nodeFileReader: FileReader = async (path: string) => {
  return await readFile(path, 'utf8');
};

export const nodeFileSystem: FileSystem = {
  getPath: () => cwd() as AbsolutePath,
  setPath: path => chdir(dirname(relative(cwd(), path))),
  readFile: nodeFileReader,
  resolve: path => resolve(path) as AbsolutePath,
};