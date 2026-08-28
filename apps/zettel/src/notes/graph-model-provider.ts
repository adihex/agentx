import { generateObject, type LanguageModel } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import type { GraphExtractionProvider } from "./graph-extraction.js";

const graphOutputSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    }),
  ),
  relations: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      relationship: z.string(),
    }),
  ),
});

/** Create a structured-output provider without coupling graph persistence to a model vendor. */
export function createGraphModelProvider(model: LanguageModel): GraphExtractionProvider {
  return {
    async extractGraph({ text }) {
      const { object } = await generateObject({
        model,
        schema: graphOutputSchema,
        prompt: [
          "Extract only entities and explicit relationships stated in this note.",
          "Every relation source and target must exactly match an entity name.",
          "Do not infer facts that are not present.",
          "",
          text,
        ].join("\n"),
      });
      return object;
    },
  };
}

export function createDefaultGraphModelProvider(): GraphExtractionProvider {
  return createGraphModelProvider(groq(process.env.GRAPH_EXTRACTION_MODEL ?? "llama-3.3-70b-versatile"));
}
