import { z } from "zod";
import { replaceNoteGraph, type NoteGraphInput } from "./store.js";

const graphSchema = z
  .object({
    entities: z.array(
      z
        .object({
          name: z.string().trim().min(1),
          type: z.string().trim().min(1),
          description: z.string().trim(),
        })
        .strict(),
    ),
    relations: z.array(
      z
        .object({
          source: z.string().trim().min(1),
          target: z.string().trim().min(1),
          relationship: z.string().trim().min(1),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((graph, context) => {
    const entityNames = new Set<string>();
    for (const entity of graph.entities) {
      if (entityNames.has(entity.name)) {
        context.addIssue({
          code: "custom",
          message: `duplicate entity: ${entity.name}`,
          path: ["entities"],
        });
      }
      entityNames.add(entity.name);
    }

    graph.relations.forEach((relation, index) => {
      if (!entityNames.has(relation.source) || !entityNames.has(relation.target)) {
        context.addIssue({
          code: "custom",
          message: "relation endpoint must be included in entities",
          path: ["relations", index],
        });
      }
    });
  });

export interface GraphExtractionRequest {
  userId: string;
  noteId: string;
  text: string;
}

/** Model-independent boundary. Implementations may call any structured-output provider. */
export interface GraphExtractionProvider {
  extractGraph(request: GraphExtractionRequest): Promise<unknown>;
}

export async function extractNoteGraph(
  provider: GraphExtractionProvider,
  userId: string,
  noteId: string,
  text: string,
): Promise<NoteGraphInput> {
  const output = await provider.extractGraph({ userId, noteId, text });
  return graphSchema.parse(output);
}

type ReplaceGraph = typeof replaceNoteGraph;

/** Persist only a fully extracted and validated graph, preserving prior data on extraction failure. */
export async function extractAndReplaceNoteGraph(
  userId: string,
  noteId: string,
  text: string,
  provider: GraphExtractionProvider,
  replaceGraph: ReplaceGraph = replaceNoteGraph,
): Promise<NoteGraphInput> {
  const graph = await extractNoteGraph(provider, userId, noteId, text);
  await replaceGraph(userId, noteId, graph);
  return graph;
}
