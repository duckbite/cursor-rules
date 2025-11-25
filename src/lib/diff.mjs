import { diffLines } from 'diff';
import chalk from 'chalk';

/**
 * Display a colored diff between local and remote file content
 * @param {string} localContent - Content of the local file
 * @param {string} remoteContent - Content of the remote file
 * @param {string} filePath - Path of the file being compared (for display)
 * @returns {string} Formatted diff output with colors
 */
export function showDiff(localContent, remoteContent, filePath) {
  const changes = diffLines(localContent, remoteContent);
  const lines = [];
  
  lines.push(chalk.bold(`\nDiff for: ${filePath}`));
  lines.push(chalk.gray('─'.repeat(60)));
  
  let localLineNum = 1;
  let remoteLineNum = 1;
  
  for (const change of changes) {
    const changeLines = change.value.split('\n');
    // Remove the last empty line if it exists (from split)
    if (changeLines.length > 0 && changeLines[changeLines.length - 1] === '') {
      changeLines.pop();
    }
    
    if (change.added) {
      // Lines added in remote (green)
      for (const line of changeLines) {
        lines.push(chalk.green(`+${String(remoteLineNum).padStart(4)}: ${line}`));
        remoteLineNum++;
      }
    } else if (change.removed) {
      // Lines removed from local (red)
      for (const line of changeLines) {
        lines.push(chalk.red(`-${String(localLineNum).padStart(4)}: ${line}`));
        localLineNum++;
      }
    } else {
      // Unchanged lines (gray, but only show a few for context)
      const contextLines = changeLines.slice(0, 3);
      for (const line of contextLines) {
        lines.push(chalk.gray(` ${String(localLineNum).padStart(4)}: ${line}`));
        localLineNum++;
        remoteLineNum++;
      }
      if (changeLines.length > 3) {
        lines.push(chalk.gray(`     ... (${changeLines.length - 3} more unchanged lines)`));
        localLineNum += changeLines.length - 3;
        remoteLineNum += changeLines.length - 3;
      }
    }
  }
  
  lines.push(chalk.gray('─'.repeat(60)));
  
  return lines.join('\n');
}

