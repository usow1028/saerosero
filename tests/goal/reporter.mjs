/** goal-deliverable: studio-guild */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const SCRATCH = process.env.SCRATCH || '/tmp/grok-goal-5f9129ee7523/implementer';

const guildSessionLines = [];
const feedGuildLines = [];
const guildInferenceLines = [];

export function recordGuildSession(line) {
  guildSessionLines.push(line);
}

export function recordFeedGuild(line) {
  feedGuildLines.push(line);
}

export function recordGuildInference(line) {
  guildInferenceLines.push(line);
}

export function flushGoalLogs() {
  mkdirSync(SCRATCH, { recursive: true });
  if (guildSessionLines.length) {
    writeFileSync(path.join(SCRATCH, 'guild-session.log'), `${guildSessionLines.join('\n')}\n`);
  }
  if (feedGuildLines.length) {
    writeFileSync(path.join(SCRATCH, 'feed-guild.log'), `${feedGuildLines.join('\n')}\n`);
  }
  if (guildInferenceLines.length) {
    writeFileSync(path.join(SCRATCH, 'guild-inference.log'), `${guildInferenceLines.join('\n')}\n`);
  }
}

export function resetGoalLogs() {
  guildSessionLines.length = 0;
  feedGuildLines.length = 0;
  guildInferenceLines.length = 0;
}