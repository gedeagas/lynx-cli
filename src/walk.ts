import fs from 'fs';
import path from 'path';

function walk(current: string, baseDir: string = current): string[] {
  if (!fs.lstatSync(current).isDirectory()) {
    return [current];
  }

  const files = fs
    .readdirSync(current)
    .map((child) => walk(path.join(current, child), baseDir));
  const result: string[] = [];
  return result.concat.apply([current], files);
}

export default walk;