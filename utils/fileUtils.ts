import * as fs from 'fs';
import {promises as fsp} from 'fs';
import * as path from 'path';

export async function writeToFile(filename: string, data: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
        const filepath = path.join(process.cwd(), 'testdata', filename);
        await fsp.writeFile(filepath, data, encoding);
        console.log(`Data written to file ${filename} successfully`);
    } catch (error) {
        console.error(`Error writing to file ${filename}:`, error);
        throw error;
    }
}

export async function readFromFile(filename: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
        const filepath = path.join(process.cwd(), 'testdata', filename);
        const data = await fsp.readFile(filepath, encoding);
        console.log(`Read data from file ${filename} successfully`);
        return data || '';
    } catch (error) {
        console.log(`Error reading from file ${filename}`, error);
        throw error;
    }
}

export function readJsonSync(filename: string): any {
    const filepath = path.join(process.cwd(), 'testdata', filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
}
