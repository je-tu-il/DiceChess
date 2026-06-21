import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pieces = {
  wk: 'wK.svg',
  wq: 'wQ.svg',
  wr: 'wR.svg',
  wb: 'wB.svg',
  wn: 'wN.svg',
  wp: 'wP.svg',
  bk: 'bK.svg',
  bq: 'bQ.svg',
  br: 'bR.svg',
  bb: 'bB.svg',
  bn: 'bN.svg',
  bp: 'bP.svg',
};

const baseUrl = 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/';
const targetDir = path.join(__dirname, '../public/pieces');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function download() {
  for (const [name, urlPath] of Object.entries(pieces)) {
    const url = baseUrl + urlPath;
    const dest = path.join(targetDir, `${name}.svg`);
    
    await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200 && res.statusCode !== 302) {
          reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
          return;
        }
        if (res.statusCode === 302) {
          https.get(res.headers.location, (res2) => {
             const file = fs.createWriteStream(dest);
             res2.pipe(file);
             file.on('finish', () => file.close(resolve));
          });
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', reject);
    });
    console.log(`Downloaded ${name}.svg`);
  }
}

download().then(() => console.log('All pieces downloaded!')).catch(console.error);
