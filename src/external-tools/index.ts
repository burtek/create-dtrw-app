import { checkGit } from './git.js';
import { checkGh } from './gh.js';

export const gitResult$ = checkGit();
export const ghResult$ = checkGh();
