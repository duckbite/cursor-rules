import { runPull } from './commands/pull.mjs';

function parseTopLevel(argv) {
  const [maybeCmd, ...rest] = argv;
  const isCmd = !maybeCmd || !maybeCmd.startsWith('-');
  const command = isCmd ? (maybeCmd || 'pull') : 'pull';
  const args = isCmd ? rest : argv;
  return { command, args };
}

export async function main(argv) {
  const { command, args } = parseTopLevel(argv);
  switch (command) {
    case 'pull':
    case undefined:
      await runPull(args);
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp(1);
  }
}

function printHelp(exitCode = 0) {
  console.log(`cursor-rules <command> [options]\n\nCommands:\n  pull               Pull all rules into destination (default)\n\nOptions (pull):\n  --dest <path>      Destination directory (default ./.cursor/rules)\n  --branch <name>    Git branch to fetch from (default main)\n  --repo <owner/repo>Source repo (default duckbite/cursor-rules)\n  --dry-run          Preview without writing files\n  --no-overwrite     Skip existing files\n  --force            Overwrite existing files\n  --help             Show this help\n`);
  if (exitCode) process.exit(exitCode);
}

