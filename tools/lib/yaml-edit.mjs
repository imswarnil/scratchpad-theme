/**
 * yaml-edit — surgical, comment-preserving edits to _config.yml.
 *
 * WHY NOT parse-and-redump. _config.yml is 60% comments, and those
 * comments are the documentation: they are how someone who has never seen
 * Jekyll works out what `style: numbered` does. A parse/serialise round
 * trip throws all of it away. So the wizard edits the TEXT — it finds the
 * line a key is on and rewrites that line, or finds the span of lines a
 * block occupies and swaps the span. Every comment outside the span
 * survives untouched, including the ones directly above the key.
 *
 * Indentation is two spaces, sequences are indented under their key, and
 * that is enforced by `dump()` rather than detected — the wizard only ever
 * writes files it also formats.
 */

/** Serialise a JS value as YAML lines at the given indent. */
export function dump(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return [`${pad}~`];
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    const out = [];
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const sub = dump(item, indent + 2);
        out.push(`${pad}- ${sub[0].trimStart()}`, ...sub.slice(1));
      } else {
        out.push(`${pad}- ${scalar(item)}`);
      }
    }
    return out;
  }
  if (typeof value === 'object') {
    const out = [];
    for (const [k, v] of Object.entries(value)) {
      if (v === null || v === undefined) continue;
      if (Array.isArray(v)) {
        if (v.length === 0) { out.push(`${pad}${k}: []`); continue; }
        out.push(`${pad}${k}:`, ...dump(v, indent + 2));
      } else if (typeof v === 'object') {
        out.push(`${pad}${k}:`, ...dump(v, indent + 2));
      } else {
        out.push(`${pad}${k}: ${scalar(v)}`);
      }
    }
    return out;
  }
  return [`${pad}${scalar(value)}`];
}

/** Quote a scalar only when YAML would otherwise misread it. */
export function scalar(v) {
  if (v === null || v === undefined) return '~';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (s === '') return '""';
  const needsQuote =
    /^[\s]|[\s]$/.test(s) ||
    /^[-?:,\[\]{}#&*!|>'"%@`]/.test(s) ||
    /:\s/.test(s) || s.includes(': ') || s.includes(' #') ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s) ||
    s.includes('\n');
  if (!needsQuote) return s;
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

const isBlank = (l) => l.trim() === '';
const isComment = (l) => /^\s*#/.test(l);
const indentOf = (l) => l.length - l.trimStart().length;

/**
 * Locate a key by path. Returns null, or:
 *   { line, indent, hasInlineValue, bodyStart, end }
 * where [line, end) is every line the key owns, and [bodyStart, end) is
 * the nested block under it (empty when the value is inline).
 */
export function findKey(lines, path) {
  let from = 0, to = lines.length, indent = 0;
  let hit = null;
  for (const key of path) {
    hit = null;
    const re = new RegExp(`^ {${indent}}(?:["']?)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:["']?):(\\s|$)`);
    for (let i = from; i < to; i++) {
      const l = lines[i];
      if (isBlank(l) || isComment(l)) continue;
      if (indentOf(l) < indent) break;
      if (re.test(l)) { hit = i; break; }
    }
    if (hit === null) return null;
    // The span this key owns: to the next line at or above its indent.
    let end = hit + 1;
    let lastReal = hit + 1;
    while (end < to) {
      const l = lines[end];
      if (isBlank(l) || isComment(l)) { end++; continue; }
      if (indentOf(l) <= indent) break;
      end++; lastReal = end;
    }
    end = lastReal;
    from = hit + 1; to = end; indent += 2;
  }
  const line = lines[hit];
  const after = line.slice(line.indexOf(':', indentOf(line)) + 1);
  return {
    line: hit,
    indent: indentOf(line),
    hasInlineValue: after.trim() !== '' && !/^\s*#/.test(after),
    bodyStart: hit + 1,
    end: to,
  };
}

/** Preserve a trailing `# comment` when rewriting a `key: value` line. */
function trailingComment(line) {
  const idx = line.indexOf(':');
  const rest = line.slice(idx + 1);
  let quote = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '#' && /\s/.test(rest[i - 1] ?? ' ')) return rest.slice(i);
  }
  return '';
}

/**
 * Set a scalar at `path`, creating the key (and its parent blocks) if it
 * is missing. Returns the new text.
 */
export function setScalar(text, path, value) {
  const lines = text.split('\n');
  const hit = findKey(lines, path);
  if (hit) {
    const cur = lines[hit.line];
    const key = cur.slice(0, cur.indexOf(':', hit.indent) + 1);
    const comment = trailingComment(cur);
    // Keep a trailing comment in the column it was written in, so a
    // hand-aligned block still lines up after the wizard has been through.
    let rewritten = `${key} ${scalar(value)}`;
    if (comment) {
      const col = cur.length - comment.length;
      rewritten += ' '.repeat(Math.max(2, col - rewritten.length)) + comment;
    }
    // Drop any stale nested block the key used to own.
    const tail = lines.slice(hit.end);
    const head = lines.slice(0, hit.line);
    return [...head, rewritten.trimEnd(), ...tail].join('\n');
  }
  return insertAtPath(lines, path, [(' '.repeat((path.length - 1) * 2)) + `${path[path.length - 1]}: ${scalar(value)}`]);
}

/**
 * Replace everything under `path` with `body` (already-indented lines),
 * keeping the `key:` line and every comment above it. Creates the key when
 * it is missing.
 */
export function setBlock(text, path, body) {
  const lines = text.split('\n');
  // An empty sequence or map has to stay on the key's own line: a bare
  // `[]` indented underneath `key:` is not what it looks like.
  const empty = body.length === 1 && (body[0].trim() === '[]' || body[0].trim() === '{}');
  const hit = findKey(lines, path);
  if (hit) {
    const cur = lines[hit.line];
    const key = cur.slice(0, cur.indexOf(':', hit.indent) + 1);
    const head = empty ? [`${key} ${body[0].trim()}`] : [key, ...body];
    return [...lines.slice(0, hit.line), ...head, ...lines.slice(hit.end)].join('\n');
  }
  const indent = ' '.repeat((path.length - 1) * 2);
  const key = `${indent}${path[path.length - 1]}:`;
  return insertAtPath(lines, path, empty ? [`${key} ${body[0].trim()}`] : [key, ...body]);
}

/** Insert new lines at the end of the parent block of `path`. */
function insertAtPath(lines, path, newLines) {
  if (path.length === 1) {
    const out = lines.slice();
    while (out.length && isBlank(out[out.length - 1])) out.pop();
    return [...out, '', ...newLines, ''].join('\n');
  }
  const parent = findKey(lines, path.slice(0, -1));
  if (!parent) {
    // No parent either — build the whole chain at the end of the file.
    const chain = [];
    path.slice(0, -1).forEach((k, i) => chain.push(`${' '.repeat(i * 2)}${k}:`));
    const out = lines.slice();
    while (out.length && isBlank(out[out.length - 1])) out.pop();
    return [...out, '', ...chain, ...newLines, ''].join('\n');
  }
  return [...lines.slice(0, parent.end), ...newLines, ...lines.slice(parent.end)].join('\n');
}

/** Remove a key and everything under it, plus the comment block above it. */
export function deleteKey(text, path, { keepComments = true } = {}) {
  const lines = text.split('\n');
  const hit = findKey(lines, path);
  if (!hit) return text;
  let start = hit.line;
  if (!keepComments) {
    while (start > 0 && isComment(lines[start - 1])) start--;
  }
  return [...lines.slice(0, start), ...lines.slice(hit.end)].join('\n');
}

/** Read the raw text of the block under `path` (for round-trip tests). */
export function blockText(text, path) {
  const lines = text.split('\n');
  const hit = findKey(lines, path);
  if (!hit) return null;
  return lines.slice(hit.line, hit.end).join('\n');
}
