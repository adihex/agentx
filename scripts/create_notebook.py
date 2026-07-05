#!/usr/bin/env python3
import json

def make_cell(cell_type, source):
    return {
        "cell_type": cell_type,
        "metadata": {},
        "source": source if isinstance(source, list) else [source]
    }

def main():
    notebook = {
        "cells": [],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 2
    }

    # 1. Title
    notebook["cells"].append(make_cell("markdown", [
        "# RAG Tutorial: Grounding AI in Curated Knowledge\n",
        "\n",
        "Welcome! This notebook will walk you step-by-step through building a **Retrieval-Augmented Generation (RAG)** pipeline. We will use the documents downloaded from your **AI Engineering** NotebookLM notebook.\n",
        "\n",
        "### Learning Objectives:\n",
        "1. Understand **Document Chunking** and sliding-window boundaries.\n",
        "2. Learn to generate and store **Dense Vector Embeddings** using ChromaDB and the Gemini API.\n",
        "3. Set up **BM25** term-frequency (keyword) search.\n",
        "4. Implement **Hybrid Search** by combining Vector and Keyword retrieval using **Reciprocal Rank Fusion (RRF)**.\n",
        "5. Generate grounded answers using **Gemini 2.5 Flash** with inline citations."
    ]))

    # 2. Imports
    notebook["cells"].append(make_cell("markdown", [
        "## Setup and Dependencies\n",
        "First, we load environment variables and import our libraries. Make sure you have a `GEMINI_API_KEY` configured in your `.env` file."
    ]))
    
    notebook["cells"].append(make_cell("code", [
        "import os\n",
        "import re\n",
        "import numpy as np\n",
        "from pathlib import Path\n",
        "from dotenv import load_dotenv\n",
        "from google import genai\n",
        "from google.genai import types\n",
        "import chromadb\n",
        "from chromadb import EmbeddingFunction\n",
        "from rank_bm25 import BM25Okapi\n",
        "\n",
        "# Load environment variables from .env file\n",
        "load_dotenv()\n",
        "\n",
        "api_key = os.getenv(\"GEMINI_API_KEY\")\n",
        "if not api_key:\n",
        "    print(\"WARNING: GEMINI_API_KEY is not set! Please add it to your .env file or export it.\")\n",
        "else:\n",
        "    print(\"Gemini API Key successfully loaded.\")"
    ]))

    # 3. Step 1: Loading Documents
    notebook["cells"].append(make_cell("markdown", [
        "## Step 1: Load Curated Sources\n",
        "We'll search the `data/sources/` folder (where our downloader script saved the texts) and list the available documents."
    ]))

    notebook["cells"].append(make_cell("code", [
        "sources_dir = Path(\"data/sources\")\n",
        "if not sources_dir.exists():\n",
        "    print(f\"Sources directory '{sources_dir}' not found. Please run the download script first.\")\n",
        "else:\n",
        "    files = list(sources_dir.glob(\"*.txt\"))\n",
        "    print(f\"Found {len(files)} text files in sources.\")\n",
        "    # Print first few files as example\n",
        "    for f in files[:5]:\n",
        "        print(f\" - {f.name} ({f.stat().st_size / 1024:.2f} KB)\")"
    ]))

    # 4. Step 2: Document Chunking
    notebook["cells"].append(make_cell("markdown", [
        "## Step 2: Document Chunking\n",
        "To index files, we split them into small, overlapping chunks. An overlap (e.g., 200–300 characters) ensures that context is not lost at the boundary lines. We'll write a chunker that breaks text at natural sentence boundaries."
    ]))

    notebook["cells"].append(make_cell("code", [
        "def split_text(text, chunk_size=1200, chunk_overlap=300):\n",
        "    \"\"\"Splits document text into overlapping chunks with sentence boundary awareness\"\"\"\n",
        "    chunks = []\n",
        "    start = 0\n",
        "    while start < len(text):\n",
        "        end = min(start + chunk_size, len(text))\n",
        "        \n",
        "        # Find a clean boundary (newline or period) in the overlap zone to split\n",
        "        if end < len(text):\n",
        "            boundary = -1\n",
        "            for i in range(end, max(start, end - chunk_overlap), -1):\n",
        "                if text[i-1] in {'.', '!', '?', '\\n'}:\n",
        "                    boundary = i\n",
        "                    break\n",
        "            if boundary != -1:\n",
        "                end = boundary\n",
        "        \n",
        "        chunk = text[start:end].strip()\n",
        "        if len(chunk) > 40:  # skip tiny chunks\n",
        "            chunks.append(chunk)\n",
        "        \n",
        "        start = end - chunk_overlap\n",
        "        if start >= len(text) or end == len(text):\n",
        "            break\n",
        "    return chunks\n",
        "\n",
        "# Let's test chunking on a sample text\n",
        "sample_text = \"This is the first sentence of our sample text. \" * 30\n",
        "sample_chunks = split_text(sample_text, chunk_size=300, chunk_overlap=50)\n",
        "print(f\"Split sample text into {len(sample_chunks)} chunks.\")\n",
        "print(\"Sample Chunk 1:\", sample_chunks[0][:100] + \"...\")"
    ]))

    # 5. Step 3: Embeddings & Vector Store
    notebook["cells"].append(make_cell("markdown", [
        "## Step 3: Embeddings & ChromaDB\n",
        "We'll construct a custom embedding function using the new `google-genai` SDK and configure a local persistent `ChromaDB` collection to store our document vectors."
    ]))

    notebook["cells"].append(make_cell("code", [
        "class GeminiEmbedder(EmbeddingFunction):\n",
        "    def __init__(self, client, model=\"gemini-embedding-001\"):\n",
        "        self.client = client\n",
        "        self.model = model\n",
        "\n",
        "    def __call__(self, input):\n",
        "        embeddings = []\n",
        "        # Batch requests of 50 to avoid API rate limits\n",
        "        batch_size = 50\n",
        "        for i in range(0, len(input), batch_size):\n",
        "            batch = input[i:i+batch_size]\n",
        "            response = self.client.models.embed_content(\n",
        "                model=self.model,\n",
        "                contents=batch\n",
        "            )\n",
        "            embeddings.extend([e.values for e in response.embeddings])\n",
        "        return embeddings\n",
        "\n",
        "# Initialize clients\n",
        "client = genai.Client()\n",
        "embedder = GeminiEmbedder(client)\n",
        "\n",
        "chroma_client = chromadb.PersistentClient(path=\"data/chroma\")\n",
        "collection = chroma_client.get_or_create_collection(\n",
        "    name=\"ai_engineering\",\n",
        "    embedding_function=embedder,\n",
        "    metadata={\"hnsw:space\": \"cosine\"}\n",
        ")\n",
        "print(f\"ChromaDB initialized. Current collection document count: {collection.count()}\")"
    ]))

    # 6. Indexing
    notebook["cells"].append(make_cell("markdown", [
        "## Step 4: Indexing Chunks into the Database\n",
        "Now, let's load all files from the `data/sources/` folder, chunk them, and add them to our database."
    ]))

    notebook["cells"].append(make_cell("code", [
        "txt_files = list(sources_dir.glob(\"*.txt\"))\n",
        "all_chunks = []\n",
        "all_metadatas = []\n",
        "all_ids = []\n",
        "\n",
        "print(\"Processing documents...\")\n",
        "for file_path in txt_files:\n",
        "    title = file_path.stem\n",
        "    with open(file_path, \"r\", encoding=\"utf-8\", errors=\"ignore\") as f:\n",
        "        content = f.read()\n",
        "    \n",
        "    chunks = split_text(content)\n",
        "    for idx, chunk_content in enumerate(chunks):\n",
        "        all_chunks.append(chunk_content)\n",
        "        all_metadatas.append({\n",
        "            \"source_title\": title,\n",
        "            \"chunk_index\": idx,\n",
        "            \"file_path\": str(file_path)\n",
        "        })\n",
        "        all_ids.append(f\"{title}_chunk_{idx}\")\n",
        "\n",
        "print(f\"Total chunks generated: {len(all_chunks)}\")\n",
        "\n",
        "# Clear existing items before indexing to avoid duplication\n",
        "chroma_client.delete_collection(\"ai_engineering\")\n",
        "collection = chroma_client.get_or_create_collection(\n",
        "    name=\"ai_engineering\",\n",
        "    embedding_function=embedder,\n",
        "    metadata={\"hnsw:space\": \"cosine\"}\n",
        ")\n",
        "\n",
        "# Add in batches of 100\n",
        "batch_size = 100\n",
        "for i in range(0, len(all_ids), batch_size):\n",
        "    print(f\"Indexing batch {i // batch_size + 1}...\")\n",
        "    collection.add(\n",
        "        documents=all_chunks[i:i+batch_size],\n",
        "        metadatas=all_metadatas[i:i+batch_size],\n",
        "        ids=all_ids[i:i+batch_size]\n",
        ")\n",
        "print(f\"ChromaDB indexing complete. Total docs in DB: {collection.count()}\")"
    ]))

    # 7. BM25 Search
    notebook["cells"].append(make_cell("markdown", [
        "## Step 5: Keyword Search (BM25)\n",
        "Vector search is great at semantic meaning, but falls short on specific technical keywords or exact phrases (like error codes or command names). We'll set up a `rank-bm25` index on the exact same chunks."
    ]))

    notebook["cells"].append(make_cell("code", [
        "def tokenize(text):\n",
        "    return re.findall(r'\\b\\w+\\b', text.lower())\n",
        "\n",
        "# Extract all documents from Chroma for BM25\n",
        "results = collection.get(include=[\"documents\", \"metadatas\"])\n",
        "bm25_chunks = []\n",
        "tokenized_corpus = []\n",
        "for doc, meta in zip(results[\"documents\"], results[\"metadatas\"]):\n",
        "    bm25_chunks.append({\n",
        "        \"content\": doc,\n",
        "        \"metadata\": meta\n",
        "    })\n",
        "    tokenized_corpus.append(tokenize(doc))\n",
        "\n",
        "bm25 = BM25Okapi(tokenized_corpus)\n",
        "print(f\"BM25 initialized with {len(bm25_chunks)} documents.\")"
    ]))

    # 8. Hybrid Search
    notebook["cells"].append(make_cell("markdown", [
        "## Step 6: Hybrid Search & Reciprocal Rank Fusion (RRF)\n",
        "We'll implement RRF, which merges rank listings from vector search and BM25 to score chunks fairly. "
    ]))

    notebook["cells"].append(make_cell("code", [
        "def retrieve_vector(query, top_n=10):\n",
        "    results = collection.query(\n",
        "        query_texts=[query],\n",
        "        n_results=top_n,\n",
        "        include=[\"documents\", \"metadatas\", \"distances\"]\n",
        "    )\n",
        "    vector_results = []\n",
        "    if results and results[\"documents\"]:\n",
        "        for doc, meta, dist in zip(results[\"documents\"][0], results[\"metadatas\"][0], results[\"distances\"][0]):\n",
        "            vector_results.append({\n",
        "                \"content\": doc,\n",
        "                \"metadata\": meta,\n",
        "                \"score\": 1.0 - dist\n",
        "            })\n",
        "    return vector_results\n",
        "\n",
        "def retrieve_bm25(query, top_n=10):\n",
        "    scores = bm25.get_scores(tokenize(query))\n",
        "    top_indices = np.argsort(scores)[::-1][:top_n]\n",
        "    bm25_results = []\n",
        "    for idx in top_indices:\n",
        "        if scores[idx] > 0:\n",
        "            bm25_results.append({\n",
        "                \"content\": bm25_chunks[idx][\"content\"],\n",
        "                \"metadata\": bm25_chunks[idx][\"metadata\"],\n",
        "                \"score\": float(scores[idx])\n",
        "            })\n",
        "    return bm25_results\n",
        "\n",
        "def hybrid_retrieve(query, top_n=5, vector_weight=0.5):\n",
        "    candidate_count = max(20, top_n * 3)\n",
        "    vector_results = retrieve_vector(query, top_n=candidate_count)\n",
        "    bm25_results = retrieve_bm25(query, top_n=candidate_count)\n",
        "\n",
        "    k = 60\n",
        "    rrf_scores = {}\n",
        "    metadata_map = {}\n",
        "\n",
        "    for rank, res in enumerate(vector_results):\n",
        "        c = res[\"content\"]\n",
        "        metadata_map[c] = res[\"metadata\"]\n",
        "        rrf_scores[c] = rrf_scores.get(c, 0.0) + (vector_weight / (k + rank + 1))\n",
        "\n",
        "    for rank, res in enumerate(bm25_results):\n",
        "        c = res[\"content\"]\n",
        "        metadata_map[c] = res[\"metadata\"]\n",
        "        rrf_scores[c] = rrf_scores.get(c, 0.0) + ((1.0 - vector_weight) / (k + rank + 1))\n",
        "\n",
        "    sorted_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)\n",
        "    \n",
        "    retrieved = []\n",
        "    for content, score in sorted_candidates[:top_n]:\n",
        "        retrieved.append({\n",
        "            \"content\": content,\n",
        "            \"metadata\": metadata_map[content],\n",
        "            \"rrf_score\": score\n",
        "        })\n",
        "    return retrieved\n",
        "\n",
        "# Let's test a hybrid query!\n",
        "test_query = \"How does vLLM optimize serving?\"\n",
        "retrieved_results = hybrid_retrieve(test_query, top_n=3)\n",
        "print(f\"Retrieved {len(retrieved_results)} chunks for query: '{test_query}'\")\n",
        "for i, res in enumerate(retrieved_results):\n",
        "    print(f\"\\nChunk {i+1} from {res['metadata']['source_title']}:\")\n",
        "    print(res['content'][:150] + \"...\")"
    ]))

    # 9. Generation
    notebook["cells"].append(make_cell("markdown", [
        "## Step 7: Grounded Response Generation\n",
        "Finally, we combine the retrieved chunks with the original query in an augmented prompt, configure system instructions to enforce strict grounding and citations, and call Gemini 2.5 Flash to generate the answer."
    ]))

    notebook["cells"].append(make_cell("code", [
        "def generate_answer(query, chunks):\n",
        "    context_parts = []\n",
        "    for idx, chunk in enumerate(chunks):\n",
        "        source = chunk[\"metadata\"][\"source_title\"]\n",
        "        context_parts.append(f\"[Source {idx+1}: {source}]\\n{chunk['content']}\\n\")\n",
        "    context_str = \"\\n\".join(context_parts)\n",
        "\n",
        "    system_instruction = (\n",
        "        \"You are an expert AI engineering assistant. \"\n",
        "        \"Your task is to answer the user's question using only the provided context. \"\n",
        "        \"Always follow these rules:\\n\"\n",
        "        \"1. Ground your answers strictly in the provided context. Do not make up facts.\\n\"\n",
        "        \"2. If the context does not contain the answer, state that you do not have enough information to answer.\\n\"\n",
        "        \"3. Cite your sources inline using [Source X] format matching the corresponding context labels (e.g., [Source 1], [Source 2]).\"\n",
        "    )\n",
        "\n",
        "    prompt = (\n",
        "        f\"Context from curated AI Engineering documents:\\n\"\n",
        "        f\"-----------------------------------------\\n\"\n",
        "        f\"{context_str}\\n\"\n",
        "        f\"-----------------------------------------\\n\"\n",
        "        f\"User Question: {query}\\n\"\n",
        "        f\"Answer:\"\n",
        "    )\n",
        "\n",
        "    response = client.models.generate_content(\n",
        "        model=\"gemini-2.5-flash\",\n",
        "        contents=prompt,\n",
        "        config=types.GenerateContentConfig(\n",
        "            system_instruction=system_instruction,\n",
        "            temperature=0.2,\n",
        "        )\n",
        "    )\n",
        "    return response.text\n",
        "\n",
        "# Generate and view response\n",
        "answer = generate_answer(test_query, retrieved_results)\n",
        "print(\"=== GROUNDED ANSWER ===\\n\")\n",
        "print(answer)"
    ]))

    # 10. Play Zone
    notebook["cells"].append(make_cell("markdown", [
        "## Step 8: Play Zone!\n",
        "Use this final cell to ask any question and see how our local RAG pipeline performs!"
    ]))

    notebook["cells"].append(make_cell("code", [
        "user_question = \"What are the different chunking methods and their performance comparison?\"\n",
        "\n",
        "retrieved_chunks = hybrid_retrieve(user_question, top_n=5)\n",
        "answer = generate_answer(user_question, retrieved_chunks)\n",
        "\n",
        "print(f\"Question: {user_question}\\n\")\n",
        "print(\"=== Answer ===\")\n",
        "print(answer)\n",
        "print(\"\\n=== Citations ===\")\n",
        "for idx, chunk in enumerate(retrieved_chunks):\n",
        "    print(f\"[{idx+1}] {chunk['metadata']['source_title']} (RRF score: {chunk['rrf_score']:.4f})\")"
    ]))

    # Write notebook file
    filepath = "rag_tutorial.ipynb"
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2)
    print(f"Jupyter Notebook successfully written to: {filepath}")

if __name__ == "__main__":
    main()
