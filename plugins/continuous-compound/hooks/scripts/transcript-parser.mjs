#!/usr/bin/env node
/**
 * Transcript Parser for Continuous Context Management
 *
 * Parses JSONL transcript files from Claude Code sessions and extracts
 * high-signal data for markdown handoff generation.
 */

import * as fs from 'fs';
import * as readline from 'readline';

async function parseTranscript(transcriptPath) {
  const summary = {
    lastTodos: [],
    recentToolCalls: [],
    lastAssistantMessage: '',
    filesModified: [],
    errorsEncountered: [],
    sessionId: null,
    sessionStartTime: null,
    sessionEndTime: null,
  };

  if (!fs.existsSync(transcriptPath)) {
    return summary;
  }

  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const allToolCalls = [];
  const modifiedFiles = new Set();
  const errors = [];
  let lastTodoState = [];
  let lastAssistant = '';

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      if (entry.timestamp) {
        if (!summary.sessionStartTime) {
          summary.sessionStartTime = entry.timestamp;
        }
        summary.sessionEndTime = entry.timestamp;
      }

      if (entry.sessionId && !summary.sessionId) {
        summary.sessionId = entry.sessionId;
      }

      const message = entry.message || entry;
      const entryType = entry.type;

      if (entryType === 'assistant' && message.content) {
        if (Array.isArray(message.content)) {
          const textBlocks = message.content.filter((b) => b.type === 'text');
          if (textBlocks.length > 0) {
            lastAssistant = textBlocks.map((b) => b.text).join('\n');
          }

          const toolUseBlocks = message.content.filter((b) => b.type === 'tool_use');
          for (const block of toolUseBlocks) {
            const toolName = block.name;
            const toolInput = block.input || {};

            if (!toolName) continue;

            const toolCall = {
              name: toolName,
              timestamp: entry.timestamp,
              input: toolInput,
              success: true,
              toolUseId: block.id,
            };

            if (toolName === 'TodoWrite' && toolInput?.todos) {
              lastTodoState = toolInput.todos.map((t, idx) => ({
                id: t.id || `todo-${idx}`,
                content: t.content || '',
                status: t.status || 'pending',
                activeForm: t.activeForm || '',
              }));
            }

            if (['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
              const filePath = toolInput?.file_path || toolInput?.path;
              if (filePath && typeof filePath === 'string') {
                modifiedFiles.add(filePath);
              }
            }

            if (toolName === 'Bash' && toolInput?.command) {
              toolCall.input = { command: toolInput.command.substring(0, 100) };
            }

            allToolCalls.push(toolCall);
          }
        } else if (typeof message.content === 'string') {
          lastAssistant = message.content;
        }
      }

      if (entryType === 'user' && message.content && Array.isArray(message.content)) {
        const toolResultBlocks = message.content.filter((b) => b.type === 'tool_result');
        for (const resultBlock of toolResultBlocks) {
          const toolUseId = resultBlock.tool_use_id;
          const matchingToolCall = allToolCalls.find((tc) => tc.toolUseId === toolUseId);

          let resultContent = resultBlock.content;
          if (Array.isArray(resultContent)) {
            resultContent = resultContent.map((c) => c.text || '').join('\n');
          }

          if (typeof resultContent !== 'string') continue;

          if (
            resultContent.includes('error') ||
            resultContent.includes('Error') ||
            resultContent.includes('failed') ||
            resultContent.includes('Failed')
          ) {
            if (matchingToolCall) {
              matchingToolCall.success = false;
            }
            const errorMatch = resultContent.match(/error[:\s]+([^\n]{1,100})/i);
            if (errorMatch) {
              errors.push(errorMatch[1].substring(0, 200));
            }
          }

          const exitCodeMatch = resultContent.match(/exit code[:\s]+(\d+)/i);
          if (exitCodeMatch && parseInt(exitCodeMatch[1], 10) !== 0) {
            if (matchingToolCall) {
              matchingToolCall.success = false;
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  summary.lastTodos = lastTodoState;
  summary.recentToolCalls = allToolCalls.slice(-10);
  summary.lastAssistantMessage = lastAssistant.substring(0, 1000);
  summary.filesModified = Array.from(modifiedFiles);
  summary.errorsEncountered = errors.slice(-5);

  return summary;
}

function calculateDuration(startTime, endTime) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `~${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `~${hours}h ${mins}m`;
  } catch {
    return 'unknown';
  }
}

function generateHandoffMarkdown(summary) {
  const lines = [];
  const timestamp = new Date().toISOString();
  const programName = process.env.CONTINUOUS_COMPOUND_PROGRAM || '_autonomous';

  lines.push('# Auto-Handoff');
  lines.push('');
  lines.push(`Generated: ${timestamp}`);

  if (summary.sessionStartTime && summary.sessionEndTime) {
    const duration = calculateDuration(summary.sessionStartTime, summary.sessionEndTime);
    lines.push(`Session Duration: ${duration}`);
  }
  lines.push('');

  lines.push('## Resume From Here');
  lines.push('');
  const inProgress = summary.lastTodos.filter((t) => t.status === 'in_progress');
  if (inProgress.length > 0) {
    lines.push(`1. **Continue**: ${inProgress[0].content}`);
  } else {
    lines.push(`1. **Check**: Current tasks in local program files (${programName})`);
  }
  lines.push('');

  lines.push('## Task State');
  lines.push('');

  if (summary.lastTodos.length > 0) {
    const todoInProgress = summary.lastTodos.filter((t) => t.status === 'in_progress');
    const pending = summary.lastTodos.filter((t) => t.status === 'pending');
    const completed = summary.lastTodos.filter((t) => t.status === 'completed');

    if (todoInProgress.length > 0) {
      lines.push('**In Progress:**');
      todoInProgress.forEach((t) => lines.push(`- [>] ${t.content}`));
      lines.push('');
    }

    if (pending.length > 0) {
      lines.push('**Pending:**');
      pending.forEach((t) => lines.push(`- [ ] ${t.content}`));
      lines.push('');
    }

    if (completed.length > 0) {
      lines.push('**Completed:**');
      completed.forEach((t) => lines.push(`- [x] ${t.content}`));
      lines.push('');
    }
  } else {
    lines.push('No TodoWrite state captured.');
    lines.push('');
  }

  lines.push('## Recent Actions');
  lines.push('');

  if (summary.recentToolCalls.length > 0) {
    summary.recentToolCalls.slice(-5).forEach((tc) => {
      const status = tc.success ? 'OK' : 'FAILED';
      lines.push(`- ${tc.name} [${status}]`);
    });
  } else {
    lines.push('No tool calls recorded.');
  }
  lines.push('');

  lines.push('## Files Modified');
  lines.push('');

  if (summary.filesModified.length > 0) {
    summary.filesModified.slice(-10).forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push('No files modified.');
  }
  lines.push('');

  if (summary.errorsEncountered.length > 0) {
    lines.push('## Errors');
    lines.push('');
    summary.errorsEncountered.forEach((e) => {
      lines.push('```');
      lines.push(e.substring(0, 100));
      lines.push('```');
    });
    lines.push('');
  }

  if (summary.lastAssistantMessage) {
    lines.push('## Last Context');
    lines.push('');
    lines.push('```');
    lines.push(summary.lastAssistantMessage.substring(0, 500));
    if (summary.lastAssistantMessage.length >= 500) {
      lines.push('[... truncated]');
    }
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node transcript-parser.mjs <transcript-path> [--markdown]');
    process.exit(1);
  }

  const transcriptPath = args[0];
  const outputMarkdown = args.includes('--markdown');

  const summary = await parseTranscript(transcriptPath);

  if (outputMarkdown) {
    console.log(generateHandoffMarkdown(summary));
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
