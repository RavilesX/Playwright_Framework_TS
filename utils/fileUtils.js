const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function writeToFile(filename, data, encoding = 'utf8') {
    try {
        const filepath = path.join(process.cwd(), 'testdata', filename);
        await fsp.writeFile(filepath, data, encoding);
        console.log(`Data written to file ${filename} successfully`);
    } catch (error) {
        console.error(`Error writing to file ${filename}:`, error);
        throw error;
    }
}

async function readFromFile(filename, encoding = 'utf8') {
    try {
        const filepath = path.join(process.cwd(), 'testdata', filename);
        const data = await fsp.readFile(filepath, encoding);
        console.log(`Read data from file ${filename} successfully`);
        return data;
    } catch (error) {
        console.log(`Error reading from file ${filename}`, error);
        throw error;
    }
}

function readJson(filename) {
    const filepath = path.join(process.cwd(), 'testdata', filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
}

export { writeToFile, readFromFile, readJson };