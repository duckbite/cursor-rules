import { DEFAULTS } from '../config.mjs';
import { listFilesRecursive, fetchFile } from '../lib/github.mjs';
import { writeFileSafe, readFile } from '../lib/fs.mjs';
import { showDiff } from '../lib/diff.mjs';
import { resolve } from 'node:path';
import { select, confirm } from '@inquirer/prompts';

function parseArgs(args) {
  const result = {
    dest: DEFAULTS.dest,
    branch: DEFAULTS.branch,
    repo: `${DEFAULTS.owner}/${DEFAULTS.repo}`,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dest') result.dest = args[++i];
    else if (a === '--branch') result.branch = args[++i];
    else if (a === '--repo') result.repo = args[++i];
    else if (a === '--help' || a === '-h') return { help: true };
  }
  return result;
}

export async function runUpdate(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: cursor-rules update [--dest <path>] [--branch <name>] [--repo <owner/repo>]');
    return;
  }

  const [owner, repo] = opts.repo.split('/');
  const destRoot = resolve(process.cwd(), opts.dest);

  console.log(`Checking for updates from ${owner}/${repo}@${opts.branch}...`);
  const files = await listFilesRecursive({ owner, repo, rootPath: DEFAULTS.rulesPath, ref: opts.branch });
  const ruleFiles = files.filter((f) => f.path.endsWith('.mdc'));

  if (ruleFiles.length === 0) {
    console.log('No .mdc rules found.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let installed = 0;
  let unchanged = 0;

  for (const file of ruleFiles) {
    const relPath = file.path.replace(/^rules\//, '');
    const localPath = resolve(destRoot, relPath);
    const localContent = await readFile(localPath);
    const remoteContent = await fetchFile({ download_url: file.download_url });

    // File doesn't exist locally
    if (localContent === null) {
      const shouldInstall = await confirm({
        message: `Install new file: ${relPath}?`,
        default: true,
      });

      if (shouldInstall) {
        const result = await writeFileSafe({
          destRoot,
          relPath,
          content: remoteContent,
          overwrite: true,
          dryRun: false,
        });
        if (result.written) {
          installed++;
          console.log(`✓ Installed ${relPath}`);
        }
      } else {
        skipped++;
        console.log(`⊘ Skipped ${relPath}`);
      }
      continue;
    }

    // File exists - check if it differs
    if (localContent === remoteContent) {
      unchanged++;
      continue;
    }

    // File differs - show diff and prompt
    const action = await select({
      message: `File changed: ${relPath}`,
      choices: [
        { name: 'View diff', value: 'diff' },
        { name: 'Overwrite with remote', value: 'overwrite' },
        { name: 'Skip (keep local)', value: 'skip' },
      ],
    });

    if (action === 'diff') {
      console.log(showDiff(localContent, remoteContent, relPath));
      // After showing diff, ask again what to do
      const afterDiff = await select({
        message: `What would you like to do with ${relPath}?`,
        choices: [
          { name: 'Overwrite with remote', value: 'overwrite' },
          { name: 'Skip (keep local)', value: 'skip' },
        ],
      });
      if (afterDiff === 'overwrite') {
        const result = await writeFileSafe({
          destRoot,
          relPath,
          content: remoteContent,
          overwrite: true,
          dryRun: false,
        });
        if (result.written) {
          updated++;
          console.log(`✓ Updated ${relPath}`);
        }
      } else {
        skipped++;
        console.log(`⊘ Skipped ${relPath}`);
      }
    } else if (action === 'overwrite') {
      const result = await writeFileSafe({
        destRoot,
        relPath,
        content: remoteContent,
        overwrite: true,
        dryRun: false,
      });
      if (result.written) {
        updated++;
        console.log(`✓ Updated ${relPath}`);
      }
    } else {
      skipped++;
      console.log(`⊘ Skipped ${relPath}`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('Update summary:');
  if (installed > 0) console.log(`  Installed: ${installed} new file(s)`);
  if (updated > 0) console.log(`  Updated: ${updated} file(s)`);
  if (skipped > 0) console.log(`  Skipped: ${skipped} file(s)`);
  if (unchanged > 0) console.log(`  Unchanged: ${unchanged} file(s)`);
  console.log('─'.repeat(60));
}

