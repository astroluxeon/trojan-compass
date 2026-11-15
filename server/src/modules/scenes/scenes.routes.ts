import type { Operation } from '../../bootstrap/http-types.js';
import type { DatasetPort } from '../../ports/service-ports.js';
import { Failure } from '../../middleware/failure.js';
export function mountScenes(operation: Operation, datasets: DatasetPort) {
  operation('get', '/buildings/{buildingId}/scene', 'SceneResponse', async (s, q, p) => {
    if (q.representation && q.representation !== 'procedural' && q.representation !== 'auto')
      throw new Failure(
        'REPRESENTATION_NOT_AVAILABLE',
        406,
        'This snapshot provides procedural geometry only.'
      );
    return { scene: await datasets.getScene(s, p.buildingId!) };
  });
}
