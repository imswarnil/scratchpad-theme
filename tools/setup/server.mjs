#!/usr/bin/env node
/**
 * `npm run setup` — the browser form that sets this site up.
 *
 * Starts a tiny HTTP server on localhost, opens a browser at it, serves
 * one page, waits for that page to POST the answers back, writes the
 * files, shows the result, and stops. Nothing is installed, nothing is
 * uploaded, and the port is only ever bound to 127.0.0.1 — the form can
 * write to your repository, so it must not be reachable from the network.
 *
 *   node tools/setup/server.mjs [--port 4321] [--no-open] [--dry-run]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { spawn } from 'node:child_process';
import { apply } from './apply.mjs';
import * as Y from '../lib/yaml-lite.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PORT = Number(opt('port', 4321));
const DRY = flag('dry-run');

/** Read the current config so the form opens pre-filled, not empty. */
function currentAnswers() {
  const c = Y.parse(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));
  const cname = fs.existsSync(path.join(ROOT, 'CNAME'))
    ? fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim() : '';
  const nav = (rows) => (rows || []).map((r) => ({
    title: r.title || '', url: r.url || '', icon: r.icon || '',
    locked: !!(r.children || r.groups),
  }));
  return {
    identity: {
      title: c.title || '', job_title: c.job_title || '', description: c.description || '',
      author: c.author || '', email: c.email || '', location: c.location || '',
      url: c.url || '', baseurl: c.baseurl || '', lang: c.lang || 'en',
      timezone: c.timezone || 'UTC', logo: c.logo || '', avatarurl: c.avatarurl || '',
      repo: c.repo || '', company: Y.get(c, 'work.company', ''), role: Y.get(c, 'work.role', ''),
    },
    look: {
      accent_color: c.accent_color || '#f22f46',
      hero_video: c.hero_video || '',
      header: { ...(c.header || {}), github: undefined, sponsor: undefined, cta: undefined },
      footer: { ...(c.footer || {}), newsletter: undefined },
      newsletter: c.footer?.newsletter || {},
      reading: c.layout || {},
    },
    nav: {
      header: nav(c.navigation_header),
      footer: nav(c.navigation_footer),
      legal: nav(c.navigation_legal),
    },
    social: Object.entries(c.social_links || {}).map(([label, url]) => ({ label, url })),
    collections: Object.entries(c.collections || {}).map(([label, v]) => ({
      label, enabled: true, title: v.title || label, singular: v.singular || '',
      description: v.description || '', icon: v.icon || '', style: v.style || 'cards',
      schema: v.schema || '', color: v.color || '',
    })),
    extras: {
      github_repo: Y.get(c, 'header.github.enabled', false) ? Y.get(c, 'header.github.repo', '') : '',
      newsletter_action: Y.get(c, 'footer.newsletter.action', ''),
      adsense_enabled: Y.get(c, 'adsense.enabled', false),
      adsense_client: Y.get(c, 'adsense.client', ''),
      service_worker: c.service_worker !== false,
      google_analytics: c.google_analytics || '',
      short_name: c.short_name || '',
      twitter_username: Y.get(c, 'twitter.username', ''),
    },
    deploy: { cname, clean_demo: false },
  };
}

function send(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, {
    'content-type': type,
    'cache-control': 'no-store',
    // The form can write to the repo. Nothing but this page may talk to it.
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  // A page on any other origin must not be able to drive this server.
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
    return send(res, 403, 'cross-origin request refused');
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const html = fs.readFileSync(path.join(HERE, 'app.html'), 'utf8')
      .replace('__STATE__', JSON.stringify(currentAnswers()).replace(/</g, '\\u003c'));
    return send(res, 200, html, 'text/html; charset=utf-8');
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    return send(res, 200, JSON.stringify(currentAnswers()), 'application/json');
  }

  if (req.method === 'POST' && pathname === '/api/apply') {
    try {
      const answers = JSON.parse(await readBody(req));
      if (DRY) {
        return send(res, 200, JSON.stringify({
          ok: true, dry: true, changed: ['(dry run — nothing written)'], notes: [], backup: null,
        }), 'application/json');
      }
      const report = apply(ROOT, answers);
      console.log('\n  Wrote:');
      for (const c of report.changed) console.log(`    · ${c}`);
      if (report.backup) console.log(`  Backup: ${report.backup}`);
      return send(res, 200, JSON.stringify({ ok: true, ...report }), 'application/json');
    } catch (err) {
      console.error('\n  ✗ ' + err.message);
      return send(res, 500, JSON.stringify({ ok: false, error: err.message }), 'application/json');
    }
  }

  if (req.method === 'POST' && pathname === '/api/done') {
    send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    setTimeout(() => { server.close(); process.exit(0); }, 150);
    return;
  }

  send(res, 404, 'not found');
});

function openBrowser(target) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', target] : [target];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* the URL is printed anyway */ }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is busy. Try:  npm run setup -- --port ${PORT + 1}\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '127.0.0.1', () => {
  const at = `http://localhost:${PORT}/`;
  console.log(`
  Scratchpad setup
  ─────────────────────────────────────────────
  Answer the form at  ${at}
  ${DRY ? 'Dry run: nothing will be written.\n  ' : ''}Nothing leaves this machine. Ctrl-C to stop.
`);
  if (!flag('no-open')) openBrowser(at);
});
