import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.join(__dirname, '..', 'src', 'lib', 'bible-data');

const BIBLE_VERSIONS = [
  { id: 'nvi', url: 'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/nvi.json' },
  { id: 'acf', url: 'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/acf.json' },
  { id: 'aa', url: 'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/aa.json' },
  { id: 'ntlh', url: 'https://cdn.jsdelivr.net/gh/damarals/biblias@master/inst/json/NTLH.json' },
  { id: 'nvt', url: 'https://cdn.jsdelivr.net/gh/damarals/biblias@master/inst/json/NVT.json' },
  { id: 'naa', url: 'https://cdn.jsdelivr.net/gh/damarals/biblias@master/inst/json/NAA.json' }
];

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  let text = await res.text();
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  // Validate that it parses as JSON
  try {
    JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON format downloaded from ${url}: ${err.message}`);
  }
  fs.writeFileSync(destPath, text, 'utf8');
}

async function run() {
  console.log('Starting Bible dataset download...');
  if (!fs.existsSync(TARGET_DIR)) {
    console.log(`Creating directory: ${TARGET_DIR}`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  for (const version of BIBLE_VERSIONS) {
    const dest = path.join(TARGET_DIR, `${version.id}.json`);
    console.log(`Downloading ${version.id.toUpperCase()} from ${version.url}...`);
    try {
      await downloadFile(version.url, dest);
      console.log(`Successfully saved ${version.id.toUpperCase()} to ${dest}`);
    } catch (err) {
      console.error(`Error downloading ${version.id.toUpperCase()}:`, err.message);
      process.exit(1);
    }
  }
  console.log('All Bible versions downloaded successfully and saved locally!');
}

run();
