import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export async function writeToLocalFile(fileName: string, data: string): Promise<string> {
  const exportDir = path.resolve(__dirname, '../../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(exportDir, fileName);
  await writeFileAsync(filePath, data, 'utf8');
  return filePath;
}

export function generateFileName(type: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${type}-export-${timestamp}.${format}`;
}
