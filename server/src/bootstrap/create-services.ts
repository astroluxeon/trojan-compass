import { SnapshotRepository } from '../infrastructure/datasets/snapshot-loader.js';
import { SearchService } from '../modules/search/search.service.js';
import { RoutingService } from '../modules/routing/routing.service.js';
import { ChatService } from '../modules/chat/chat.service.js';
import {
  LocalIntentProvider,
  OpenAIIntentProvider,
  type IntentProvider,
} from '../integrations/ai/provider-adapter.js';
export function createServices(
  options: { datasets?: SnapshotRepository; provider?: IntentProvider } = {}
) {
  if (process.env.AI_MODE && !['local', 'openai'].includes(process.env.AI_MODE))
    throw new Error('AI_MODE must be local or openai.');
  const datasets = options.datasets ?? new SnapshotRepository(process.env.DATASET_ROOT);
  const search = new SearchService(datasets);
  const routing = new RoutingService(datasets);
  const provider =
    options.provider ??
    (process.env.AI_MODE === 'openai'
      ? new OpenAIIntentProvider({
          apiKey: process.env.AI_API_KEY,
          model: process.env.AI_MODEL,
          baseUrl: process.env.AI_BASE_URL,
        })
      : new LocalIntentProvider());
  return {
    datasets,
    search,
    routing,
    chat: new ChatService({ datasets, search, routing }, provider),
  };
}
