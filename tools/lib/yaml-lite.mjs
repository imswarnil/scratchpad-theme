/**
 * yaml-lite — a reader for the subset of YAML that _config.yml uses.
 *
 * WHY THIS EXISTS. Scratchpad's tooling has no npm dependencies: `npm run
 * setup` must work on a machine that has just cloned the repo, offline, in
 * the ten seconds before someone loses interest. A YAML library is the only
 * thing we would have needed, and we only need to read our own file.
 *
 * WHAT IT HANDLES
 *   key: value                  scalars (quoted or bare), with # comments
 *   key:                        nested maps, by indentation
 *     sub: value
 *   list:                       sequences of scalars and of maps
 *     - a
 *     - title: x
 *       url: y
 *   inline: [a, b, c]           flow sequences
 *   text: >                     folded and literal block scalars
 *     wrapped
 *
 * WHAT IT DOES NOT. Anchors, aliases, tags, multi-document files, flow
 * MAPPINGS ({a: 1}), complex keys. If you need one of those in _config.yml,
 * you have outgrown this file — reach for a real parser instead of
 * stretching this one.
 *
 * Reading only. Writes go through yaml-edit.mjs, which edits the TEXT so
 * every comment in _config.yml survives.
 */

const RE_KEY = /^([^\s#][^:]*?):(?:\s+(.*))?$/;

/** Strip a trailing `# comment` that is not inside quotes. */
function stripComment(s) {
  let out = '', quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      out += c;
      if (c === quote && s[i - 1] !== '\\') quote = null;
    } else if (c === '"' || c === "'") {
      quote = c; out += c;
    } else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
      break;
    } else out += c;
  }
  return out.trimEnd();
}

/** Turn one bare YAML scalar into a JS value. */
export function parseScalar(raw) {
  const s = (raw ?? '').trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  if (s.startsWith('"') && s.endsWith('"') && s.length > 1) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length > 1) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitFlow(inner).map((x) => parseScalar(x));
  }
  return s;
}

/** Split "a, b, [c, d]" on top-level commas only. */
function splitFlow(s) {
  const out = [];
  let depth = 0, quote = null, cur = '';
  for (const c of s) {
    if (quote) { cur += c; if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === '[') depth++;
    if (c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Tokenise into {indent, body} lines, dropping blanks and whole-line comments. */
function tokenise(text) {
  const lines = [];
  const raw = text.split('\n');
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.length - line.trimStart().length;
    lines.push({ indent, body: line.trimStart(), n: i });
  }
  return lines;
}

/**
 * Parse a block-scalar body (`>` or `|`) starting at `i`, which is the
 * first CONTENT line. Returns [text, nextIndex].
 */
function readBlockScalar(rawLines, i, parentIndent, fold) {
  const collected = [];
  while (i < rawLines.length) {
    const line = rawLines[i];
    if (line.trim() === '') { collected.push(''); i++; continue; }
    const indent = line.length - line.trimStart().length;
    if (indent <= parentIndent) break;
    collected.push(line.trimStart());
    i++;
  }
  while (collected.length && collected[collected.length - 1] === '') collected.pop();
  return [fold ? collected.join(' ').replace(/\s+/g, ' ').trim() : collected.join('\n'), i];
}

/** Parse a YAML document into a plain JS object. */
export function parse(text) {
  const raw = text.split('\n');
  const [value] = parseBlock(raw, 0, 0);
  return value ?? {};
}

function nextMeaningful(raw, i) {
  while (i < raw.length && (!raw[i].trim() || /^\s*#/.test(raw[i]))) i++;
  return i;
}

/** Parse everything at `indent` or deeper, starting at raw line `i`. */
function parseBlock(raw, i, indent) {
  i = nextMeaningful(raw, i);
  if (i >= raw.length) return [null, i];

  const firstIndent = raw[i].length - raw[i].trimStart().length;
  if (firstIndent < indent) return [null, i];

  // A sequence?
  if (raw[i].trimStart().startsWith('- ') || raw[i].trim() === '-') {
    const list = [];
    while (i < raw.length) {
      i = nextMeaningful(raw, i);
      if (i >= raw.length) break;
      const ind = raw[i].length - raw[i].trimStart().length;
      const body = raw[i].trimStart();
      if (ind !== firstIndent || !(body.startsWith('- ') || body === '-')) break;

      const rest = body === '-' ? '' : body.slice(2);
      const itemIndent = firstIndent + 2;
      if (rest === '') { i++; const [v, ni] = parseBlock(raw, i, itemIndent); list.push(v); i = ni; continue; }

      const m = RE_KEY.exec(stripComment(rest));
      if (m) {
        // A map that starts on the dash line: re-read it as a block by
        // pretending the dash was spaces.
        const patched = raw.slice();
        patched[i] = ' '.repeat(itemIndent) + rest;
        const [v, ni] = parseBlock(patched, i, itemIndent);
        list.push(v); i = ni;
      } else {
        list.push(parseScalar(stripComment(rest))); i++;
      }
    }
    return [list, i];
  }

  // A mapping.
  const map = {};
  while (i < raw.length) {
    i = nextMeaningful(raw, i);
    if (i >= raw.length) break;
    const ind = raw[i].length - raw[i].trimStart().length;
    if (ind < firstIndent) break;
    if (ind > firstIndent) { i++; continue; }          // stray deeper line
    const body = stripComment(raw[i].trimStart());
    if (body.startsWith('- ')) break;
    const m = RE_KEY.exec(body);
    if (!m) { i++; continue; }
    const key = m[1].trim().replace(/^["']|["']$/g, '');
    const inline = (m[2] ?? '').trim();

    if (inline === '>' || inline === '|' || inline === '>-' || inline === '|-') {
      const [v, ni] = readBlockScalar(raw, i + 1, ind, inline[0] === '>');
      map[key] = v; i = ni; continue;
    }
    if (inline !== '') { map[key] = parseScalar(inline); i++; continue; }

    // `key:` followed by an indented `[…]` — a flow sequence on its own line.
    const peek = nextMeaningful(raw, i + 1);
    if (peek < raw.length) {
      const pb = raw[peek].trim();
      if ((raw[peek].length - raw[peek].trimStart().length) > ind && pb.startsWith('[') && pb.endsWith(']')) {
        map[key] = parseScalar(pb); i = peek + 1; continue;
      }
    }
    const [v, ni] = parseBlock(raw, i + 1, ind + 1);
    map[key] = v === null ? null : v;
    i = ni === i + 1 ? i + 1 : ni;
  }
  return [map, i];
}

/** Read a nested value: get(cfg, 'header.github.enabled'). */
export function get(obj, path, fallback = undefined) {
  const v = String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  return v === undefined || v === null ? fallback : v;
}
