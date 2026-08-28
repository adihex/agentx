import unittest

from rag import reciprocal_rank_fusion, split_text


class SplitTextTests(unittest.TestCase):
    def test_returns_short_document_when_minimum_is_met(self) -> None:
        self.assertEqual(split_text("A complete sentence.", min_chunk_chars=1), ["A complete sentence."])

    def test_prefers_sentence_boundary_and_preserves_overlap(self) -> None:
        text = "Alpha bravo. Charlie delta echo. Foxtrot golf hotel."

        chunks = split_text(text, chunk_size=36, chunk_overlap=8, min_chunk_chars=1)

        self.assertEqual(chunks, ["Alpha bravo. Charlie delta echo.", "ta echo. Foxtrot golf hotel."])

    def test_falls_back_to_fixed_width_when_no_boundary_exists(self) -> None:
        self.assertEqual(
            split_text("abcdefghijkl", chunk_size=5, chunk_overlap=2, min_chunk_chars=1),
            ["abcde", "defgh", "ghijk", "jkl"],
        )

    def test_skips_blank_and_tiny_chunks(self) -> None:
        self.assertEqual(split_text("   ", min_chunk_chars=1), [])
        self.assertEqual(split_text("tiny", min_chunk_chars=5), [])

    def test_rejects_invalid_configuration(self) -> None:
        for kwargs in (
            {"chunk_size": 0},
            {"chunk_overlap": -1},
            {"chunk_size": 10, "chunk_overlap": 10},
            {"min_chunk_chars": -1},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                split_text("text", **kwargs)


class ReciprocalRankFusionTests(unittest.TestCase):
    def test_combines_rankings_with_standard_rrf_score(self) -> None:
        fused = reciprocal_rank_fusion([["a", "b"], ["b", "c"]], k=60)

        self.assertEqual([item for item, _ in fused], ["b", "a", "c"])
        self.assertAlmostEqual(fused[0][1], 1 / 62 + 1 / 61)

    def test_applies_weights_and_limit(self) -> None:
        fused = reciprocal_rank_fusion(
            [["vector-first", "shared"], ["shared", "keyword-first"]],
            weights=[0.8, 0.2],
            k=0,
            limit=2,
        )

        self.assertEqual([item for item, _ in fused], ["vector-first", "shared"])
        self.assertAlmostEqual(fused[0][1], 0.8)
        self.assertAlmostEqual(fused[1][1], 0.6)

    def test_ignores_duplicate_item_within_one_ranking(self) -> None:
        fused = reciprocal_rank_fusion([["a", "a", "b"]], k=0)

        self.assertEqual(fused, [("a", 1.0), ("b", 0.5)])

    def test_ties_keep_first_seen_order(self) -> None:
        self.assertEqual(
            reciprocal_rank_fusion([["a"], ["b"]], k=0),
            [("a", 1.0), ("b", 1.0)],
        )

    def test_rejects_invalid_configuration(self) -> None:
        invalid_calls = (
            lambda: reciprocal_rank_fusion([["a"]], k=-1),
            lambda: reciprocal_rank_fusion([["a"]], weights=[1, 2]),
            lambda: reciprocal_rank_fusion([["a"]], weights=[-1]),
            lambda: reciprocal_rank_fusion([["a"]], limit=-1),
        )
        for call in invalid_calls:
            with self.subTest(call=call), self.assertRaises(ValueError):
                call()


if __name__ == "__main__":
    unittest.main()
