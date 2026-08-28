import unittest

from rag import Citation, RAGPipeline, RetrievalHit


class RAGPipelineTests(unittest.TestCase):
    def test_fuses_retrievers_and_builds_stably_labeled_context(self) -> None:
        calls: list[tuple[str, str]] = []

        def dense(query: str, limit: int) -> list[RetrievalHit]:
            self.assertEqual((query, limit), ("What is AgentX?", 3))
            return [
                RetrievalHit("dense", "Dense-only text", {"url": "dense.example"}),
                RetrievalHit("shared", "Shared grounded text", {"page": 7}),
            ]

        def lexical(query: str, limit: int) -> list[RetrievalHit]:
            return [
                RetrievalHit("shared", "Shared grounded text", {"page": 7}),
                RetrievalHit("lexical", "Lexical-only text", {"section": "intro"}),
            ]

        def generate(question: str, context: str) -> str:
            calls.append((question, context))
            return "AgentX is grounded [SOURCE_1]."

        result = RAGPipeline(dense, lexical, generate, retrieval_limit=3).run("What is AgentX?")

        self.assertFalse(result.insufficient_information)
        self.assertEqual(result.answer, "AgentX is grounded [SOURCE_1].")
        self.assertEqual(
            result.context,
            "[SOURCE_1]\nShared grounded text\n\n"
            "[SOURCE_2]\nDense-only text\n\n"
            "[SOURCE_3]\nLexical-only text",
        )
        self.assertEqual(calls, [("What is AgentX?", result.context)])
        self.assertEqual(
            result.citations,
            (
                Citation("SOURCE_1", "shared", {"page": 7}),
                Citation("SOURCE_2", "dense", {"url": "dense.example"}),
                Citation("SOURCE_3", "lexical", {"section": "intro"}),
            ),
        )

    def test_returns_explicit_insufficient_result_without_generation(self) -> None:
        generated = False

        def retrieve(query: str, limit: int) -> list[RetrievalHit]:
            return []

        def generate(question: str, context: str) -> str:
            nonlocal generated
            generated = True
            return "unsupported"

        result = RAGPipeline(retrieve, retrieve, generate).run("unknown")

        self.assertTrue(result.insufficient_information)
        self.assertEqual(result.answer, "Insufficient information in the retrieved sources.")
        self.assertEqual(result.context, "")
        self.assertEqual(result.citations, ())
        self.assertFalse(generated)

    def test_deduplicates_by_id_and_preserves_first_seen_metadata(self) -> None:
        dense_hit = RetrievalHit("same", "canonical text", {"provider": "dense"})
        lexical_hit = RetrievalHit("same", "other text", {"provider": "lexical"})

        result = RAGPipeline(
            lambda _query, _limit: [dense_hit],
            lambda _query, _limit: [lexical_hit],
            lambda _question, _context: "answer",
        ).run("question")

        self.assertEqual(result.context, "[SOURCE_1]\ncanonical text")
        self.assertEqual(result.citations[0].metadata, {"provider": "dense"})


if __name__ == "__main__":
    unittest.main()
