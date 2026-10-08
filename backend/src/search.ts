import { Client } from '@elastic/elasticsearch';
import { config } from './config';

export const es = new Client({
  node: config.esNode,
  maxRetries: 1,
  requestTimeout: 2000,
});
const INDEX = 'emails';

export async function initES() {
  try {
    if (!(await es.indices.exists({ index: INDEX }))) {
      await es.indices.create({ index: INDEX });
    }
  } catch (err: any) {
    console.warn('[Elasticsearch] Index initialization skipped:', err.message);
  }
}

export async function indexEmail(doc: any) {
  try {
    await es.index({ index: INDEX, id: doc.id, document: doc });
  } catch (err: any) {
    console.warn('[Elasticsearch] Index email skipped:', err.message);
  }
}

export async function searchEmails(userId: string, query: string, statuses: string[]) {
  try {
    const res = await es.search({
      index: INDEX,
      query: {
        bool: {
          must: [
            { term: { userId } },
            { terms: { status: statuses } },
            { multi_match: { query, fields: ['recipientEmail', 'subject', 'body'] } },
          ],
        },
      },
    });
    return res.hits.hits.map((h: any) => h._source);
  } catch (err: any) {
    console.warn('[Elasticsearch] Search query failed, falling back:', err.message);
    return [];
  }
}
