"""Dependency-free building blocks for retrieval-augmented generation."""

from collections.abc import Hashable, Iterable, Sequence
from typing import TypeVar

T = TypeVar("T", bound=Hashable)


def split_text(
    text: str,
    chunk_size: int = 1200,
    chunk_overlap: int = 300,
    min_chunk_chars: int = 40,
) -> list[str]:
    """Split text into deterministic overlapping character windows.

    When possible, a window ends at the last sentence or newline boundary
    inside its overlap-sized tail. Leading and trailing whitespace is removed
    from each returned chunk.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be non-negative and smaller than chunk_size")
    if min_chunk_chars < 0:
        raise ValueError("min_chunk_chars must be non-negative")

    chunks: list[str] = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length:
            boundary_floor = max(start, end - chunk_overlap)
            for index in range(end, boundary_floor, -1):
                if text[index - 1] in ".!?\n":
                    end = index
                    break

        chunk = text[start:end].strip()
        if len(chunk) >= min_chunk_chars and chunk:
            chunks.append(chunk)

        if end == text_length:
            break
        start = end - chunk_overlap

    return chunks


def reciprocal_rank_fusion(
    rankings: Sequence[Iterable[T]],
    *,
    weights: Sequence[float] | None = None,
    k: float = 60,
    limit: int | None = None,
) -> list[tuple[T, float]]:
    """Fuse ranked item lists using weighted reciprocal rank fusion.

    An item contributes ``weight / (k + rank)`` for each ranking containing
    it, where ranks are one-based. Duplicate items in a ranking are ignored.
    Score ties retain the order in which items were first encountered.
    """
    if k < 0:
        raise ValueError("k must be non-negative")
    if limit is not None and limit < 0:
        raise ValueError("limit must be non-negative")

    ranking_weights = list(weights) if weights is not None else [1.0] * len(rankings)
    if len(ranking_weights) != len(rankings):
        raise ValueError("weights must contain one value per ranking")
    if any(weight < 0 for weight in ranking_weights):
        raise ValueError("weights must be non-negative")

    scores: dict[T, float] = {}
    first_seen: dict[T, int] = {}
    for ranking, weight in zip(rankings, ranking_weights, strict=True):
        seen: set[T] = set()
        rank = 0
        for item in ranking:
            if item in seen:
                continue
            seen.add(item)
            rank += 1
            first_seen.setdefault(item, len(first_seen))
            scores[item] = scores.get(item, 0.0) + weight / (k + rank)

    fused = sorted(scores.items(), key=lambda pair: (-pair[1], first_seen[pair[0]]))
    return fused if limit is None else fused[:limit]
