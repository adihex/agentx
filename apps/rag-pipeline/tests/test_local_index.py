import unittest

from rag import Document, LocalDocumentIndex


class LocalDocumentIndexTests(unittest.TestCase):
    def test_indexes_caller_documents_without_title_or_filename_collisions(self) -> None:
        index = LocalDocumentIndex(chunk_size=30, chunk_overlap=0, min_chunk_chars=1)
        index.rebuild(
            [
                Document("doc/a", "shared title alpha unique", {"source": "first", "title": "Same"}),
                Document("doc:b", "shared title beta unique", {"source": "second", "title": "Same"}),
            ]
        )

        alpha = index("alpha", 5)
        beta = index("beta", 5)

        self.assertEqual(len(alpha), 1)
        self.assertEqual(len(beta), 1)
        self.assertNotEqual(alpha[0].document_id, beta[0].document_id)
        self.assertEqual(alpha[0].metadata, {"source": "first", "title": "Same", "document_id": "doc/a"})
        self.assertEqual(beta[0].metadata["document_id"], "doc:b")

    def test_rebuild_replaces_previous_contents_and_is_idempotent(self) -> None:
        index = LocalDocumentIndex(min_chunk_chars=1)
        documents = [Document("stable", "repeatable needle", {"source": "caller"})]

        index.rebuild(documents)
        first = index("needle", 10)
        index.rebuild(documents)
        second = index("needle", 10)

        self.assertEqual(first, second)
        index.rebuild([Document("replacement", "different token", {})])
        self.assertEqual(index("needle", 10), [])

    def test_ranks_overlap_deterministically_and_respects_limit(self) -> None:
        index = LocalDocumentIndex(min_chunk_chars=1)
        index.rebuild(
            [
                Document("z", "red blue", {}),
                Document("a", "red blue green", {}),
                Document("m", "red only", {}),
            ]
        )

        hits = index("RED, blue green", 2)

        self.assertEqual([hit.metadata["document_id"] for hit in hits], ["a", "z"])
        self.assertEqual(index("absent", 3), [])
        self.assertEqual(index("red", 0), [])

    def test_rejects_duplicate_caller_ids(self) -> None:
        index = LocalDocumentIndex(min_chunk_chars=1)

        with self.assertRaisesRegex(ValueError, "duplicate document id"):
            index.rebuild([Document("same", "one", {}), Document("same", "two", {})])


if __name__ == "__main__":
    unittest.main()
