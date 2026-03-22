#!/usr/bin/env node
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3333;
const basePath = process.env.BASE_PATH || path.join(__dirname, '.kv-local');

async function diskPath(namespace, key) {
  const dirPath = [basePath, namespace];
  const fileName = `${encodeURIComponent(key)}.txt`;
  
  // Create directory if it doesn't exist
  try {
    await fs.mkdir(path.join(basePath, namespace), { recursive: true });
  } catch (e) {
    // ignore
  }
  
  return path.join(basePath, namespace, fileName);
}

async function get(key) {
  const splitKey = key.includes('#') ? key.split('#') : ['main', key];
  const namespace = splitKey.shift();
  const k = splitKey.join('#') || 'index';
  try {
    return await fs.readFile(await diskPath(namespace, k), 'utf8');
  } catch (e) {
    return null;
  }
}

async function set(key, value) {
  const splitKey = key.includes('#') ? key.split('#') : ['main', key];
  const namespace = splitKey.shift();
  const k = splitKey.join('#') || 'index';
  await fs.writeFile(await diskPath(namespace, k), value, 'utf8');
}

async function del(key) {
  const splitKey = key.includes('#') ? key.split('#') : ['main', key];
  const namespace = splitKey.shift();
  const k = splitKey.join('#') || 'index';
  try {
    await fs.unlink(await diskPath(namespace, k));
  } catch (e) {
    // ignore
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const key = url.searchParams.get('key');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (!key) {
    res.writeHead(400);
    res.end('Missing key parameter');
    return;
  }
  
  try {
    if (req.method === 'GET') {
      const value = await get(key);
      if (value === null) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(value);
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        await set(key, body);
        res.writeHead(200);
        res.end('OK');
      });
    } else if (req.method === 'DELETE') {
      await del(key);
      res.writeHead(200);
      res.end('OK');
    } else {
      res.writeHead(405);
      res.end('Method not allowed');
    }
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end(e.message);
  }
});

server.listen(port, () => {
  console.log(`Civil Memory KV server running on http://localhost:${port}`);
  console.log(`Base path: ${basePath}`);
});
