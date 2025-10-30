import { DEFAULTS } from '../config.mjs';
import { listFilesRecursive, fetchFile } from '../lib/github.mjs';
import { writeFileSafe } from '../lib/fs.mjs';
import { resolve } from 'node:path';

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

export async function runPull(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: cursor-rules pull [--dest <path>] [--branch <name>] [--repo <owner/repo>] [--dry-run] [--no-overwrite] [--force]');
    return;
  }

  const [owner, repo] = opts.repo.split('/');
  const destRoot = resolve(process.cwd(), opts.dest);
  console.log(`Fetching rules from ${owner}/${repo}@${opts.branch} into ${destRoot}${opts.dryRun ? ' (dry-run)' : ''}...`);

  const files = await listFilesRecursive({ owner, repo, rootPath: DEFAULTS.rulesPath, ref: opts.branch });
  const ruleFiles = files.filter((f) => f.path.endsWith('.mdc'));

  let written = 0, skipped = 0, planned = 0;
  for (const f of ruleFiles) {
    planned++;
    const content = await fetchFile({ download_url: f.download_url });
    const relPath = f.path.replace(/^rules\//, '');
    const result = await writeFileSafe({ destRoot, relPath, content, overwrite: opts.overwrite, dryRun: opts.dryRun });
    if (result.skipped) skipped++;
    else if (!opts.dryRun) written++;
  }

  if (opts.dryRun) {
    console.log(`Planned ${planned} files. Would write ${planned - skipped} (skipped ${skipped}).`);
  } else {
    console.log(`Wrote ${written} files (skipped ${skipped}).`);
  }
}

