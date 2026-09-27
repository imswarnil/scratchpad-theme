#!/usr/bin/env node
/**
 * `npx scratchpad-theme my-site` — stand up a site from this theme.
 *
 * It clones the theme, drops the git history so the first commit is the
 * person's own, removes the demo content they would only have to delete,
 * and then hands over to the browser setup form. Everything it does is
 * something they could do by hand in four commands; the point is that
 * they do not have to know which four.
 *
 *   npx scratchpad-theme            → asks for a folder name
 *   npx scratchpad-theme my-site    → uses that one
 *   npx scratchpad-theme my-site --keep-demo --no-setup
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const REPO = 'https://github.com/imswarnil/Personal-Website-Jekyll-Theme.git';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const positional = argv.filter((a) => !a.startsWith('--'));

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
};

function has(cmd) {
  return spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(c.red(`\n  ${cmd} ${args.join(' ')} failed.`));
    process.exit(r.status ?? 1);
  }
}

const DEMO = [
  '_posts', '_portfolio', '_videos', '_snippets', '_prompts', '_webseries',
  '_episodes', '_courses', '_lessons', '_podcast', '_newsletter', '_travel',
  '_uses', 'assets/img/demo',
];

async function main() {
  console.log(`\n  ${c.bold('Scratchpad')} — a personal site on Jekyll\n`);

  if (!has('git')) {
    console.error(c.red('  git is required and was not found on your PATH.\n'));
    process.exit(1);
  }

  let dir = positional[0];
  if (!dir) {
    const rl = readline.createInterface({ input, output });
    dir = (await rl.question('  Folder name  ' + c.dim('(my-site)') + '  ')).trim() || 'my-site';
    rl.close();
  }

  const dest = path.resolve(process.cwd(), dir);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
    console.error(c.red(`\n  ${dir} already exists and is not empty.\n`));
    process.exit(1);
  }

  console.log(`\n  Cloning into ${c.bold(dir)}…\n`);
  run('git', ['clone', '--depth', '1', REPO, dest]);

  // The history belongs to the theme, not to the person using it.
  fs.rmSync(path.join(dest, '.git'), { recursive: true, force: true });

  if (!flag('keep-demo')) {
    for (const rel of DEMO) {
      fs.rmSync(path.join(dest, rel), { recursive: true, force: true });
      fs.mkdirSync(path.join(dest, rel), { recursive: true });
    }
    // A collection with no entries builds to an empty page rather than
    // breaking, and `npm run new` fills them one at a time.
    console.log(c.dim('  Removed the demo content (--keep-demo to keep it).'));
  }

  // Their site, their domain: ours would 404 for them.
  fs.rmSync(path.join(dest, 'CNAME'), { force: true });

  run('git', ['init', '-q'], dest);
  run('git', ['add', '-A'], dest);
  run('git', ['commit', '-q', '-m', 'Start a site from the Scratchpad theme'], dest);

  console.log(c.green('\n  Done.\n'));

  if (!flag('no-setup')) {
    console.log('  Opening the setup form…\n');
    spawnSync(process.execPath, [path.join(dest, 'tools', 'setup', 'server.mjs')], {
      cwd: dest, stdio: 'inherit',
    });
  }

  console.log(`
  Next:

    cd ${dir}
    npm run dev            ${c.dim('# http://localhost:4000')}

  Then create a repository named ${c.bold('username.github.io')}, push to
  main, and set Settings → Pages → Source to ${c.bold('GitHub Actions')}.

  The manual is at /docs/ once it is running, and in .claude/skills/.
`);
}

main().catch((e) => {
  console.error(c.red(`\n  ${e.message}\n`));
  process.exit(1);
});
