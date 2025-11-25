import { mkdir, writeFile as fsWriteFile, access, readFile as fsReadFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { constants as fsConstants } from 'node:fs';

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath) {
  try {
    const content = await fsReadFile(filePath, 'utf8');
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeFileSafe({ destRoot, relPath, content, overwrite, dryRun }) {
  const absPath = resolve(destRoot, relPath);
  const dir = dirname(absPath);
  await ensureDir(dir);

  const already = await exists(absPath);
  if (already && !overwrite) {
    return { skipped: true, path: absPath };
  }
  if (dryRun) {
    return { dryRun: true, path: absPath };
  }
  await fsWriteFile(absPath, content, 'utf8');
  return { written: true, path: absPath };
}

