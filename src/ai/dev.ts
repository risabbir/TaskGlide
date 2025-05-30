
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-task-tags.ts';
import '@/ai/flows/enhance-task-description.ts';
import '@/ai/flows/suggest-task-subtasks.ts';
import '@/ai/flows/suggest-focus-batch.ts';
