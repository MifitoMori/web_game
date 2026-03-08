import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('Путь к pages:', path.resolve(__dirname, 'pages'));
