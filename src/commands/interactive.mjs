import { DEFAULTS } from '../config.mjs';
import { listFilesRecursive, fetchFile } from '../lib/github.mjs';
import { writeFileSafe } from '../lib/fs.mjs';
import { resolve } from 'node:path';
import { checkbox, input } from '@inquirer/prompts';

function parseArgs(args) {
  const result = {
    dest: DEFAULTS.dest,
    branch: DEFAULTS.branch,
    repo: `${DEFAULTS.owner}/${DEFAULTS.repo}`,
    dryRun: false,
    overwrite: true,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dest') result.dest = args[++i];
    else if (a === '--branch') result.branch = args[++i];
    else if (a === '--repo') result.repo = args[++i];
    else if (a === '--dry-run') result.dryRun = true;
    else if (a === '--no-overwrite') result.overwrite = false;
    else if (a === '--force') result.overwrite = true;
    else if (a === '--help' || a === '-h') return { help: true };
  }
  return result;
}

export async function runInteractive(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: cursor-rules interactive [--dest <path>] [--branch <name>] [--repo <owner/repo>] [--dry-run] [--no-overwrite] [--force]');
    return;
  }

  const [owner, repo] = opts.repo.split('/');
  const destRoot = resolve(process.cwd(), opts.dest);

  console.log(`Loading rules from ${owner}/${repo}@${opts.branch} ...`);
  const files = await listFilesRecursive({ owner, repo, rootPath: DEFAULTS.rulesPath, ref: opts.branch });
  const ruleFiles = files.filter((f) => f.path.endsWith('.mdc'));

  if (ruleFiles.length === 0) {
    console.log('No .mdc rules found.');
    return;
  }

  const search = await input({ message: 'Filter (type to narrow, leave blank for all):', default: '' });
  const filtered = search
    ? ruleFiles.filter((f) => f.path.toLowerCase().includes(search.toLowerCase()))
    : ruleFiles;

  if (filtered.length === 0) {
    console.log(`No rules match "${search}". Try a different filter or leave it blank for all.`);
    return;
  }

  const choices = filtered.map((f) => ({
    name: f.path.replace(/^rules\//, ''),
    value: f,
  }));

  const selected = await checkbox({
    message: `Select rules to pull (${choices.length} available):`,
    choices,
    pageSize: 20,
    instructions: false,
    loop: false,
  });

  if (!selected.length) {
    console.log('No files selected. Exiting.');
    return;
  }

  console.log(`Fetching ${selected.length} files into ${destRoot}${opts.dryRun ? ' (dry-run)' : ''}...`);

  let written = 0, skipped = 0;
  for (const f of selected) {
    const content = await fetchFile({ download_url: f.download_url });
    const relPath = f.path.replace(/^rules\//, '');
    const result = await writeFileSafe({ destRoot, relPath, content, overwrite: opts.overwrite, dryRun: opts.dryRun });
    if (result.skipped) skipped++;
    else if (!opts.dryRun) written++;
  }

  if (opts.dryRun) {
    console.log(`Planned ${selected.length} files. Would write ${selected.length - skipped} (skipped ${skipped}).`);
  } else {
    console.log(`Wrote ${written} files (skipped ${skipped}).`);
  }
}

