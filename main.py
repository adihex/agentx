#!/usr/bin/env python3
import os
import sys
import argparse
from dotenv import load_dotenv
from rag.pipeline import RAGPipeline

def parse_args():
    parser = argparse.ArgumentParser(description="AI Engineering RAG CLI")
    parser.add_argument(
        "--index",
        action="store_true",
        help="Reindex documents from the data/sources folder"
    )
    parser.add_argument(
        "--query",
        type=str,
        help="Run a single query and exit"
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=5,
        help="Number of chunks to retrieve (default: 5)"
    )
    return parser.parse_args()

def interactive_loop(pipeline, top_n):
    print("\n" + "=" * 50)
    print("Welcome to the AI Engineering RAG interactive assistant!")
    print("Ask any question about RAG, vLLM, LLMOps, or scaling.")
    print("Type 'exit' or 'quit' to end the session.")
    print("=" * 50 + "\n")

    while True:
        try:
            query = input("Ask a question: ").strip()
            if not query:
                continue
            if query.lower() in {"exit", "quit"}:
                print("Goodbye!")
                break
                
            run_query(pipeline, query, top_n)
            print("-" * 50 + "\n")
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

def run_query(pipeline, query, top_n):
    print(f"\nRetrieving relevant contexts for: '{query}'...")
    
    # Retrieve chunks
    chunks = pipeline.retrieve(query, top_n=top_n)
    
    if not chunks:
        print("No matching information found in the local database. Have you indexed yet? (run: python3 main.py --index)")
        return
        
    print(f"Retrieved {len(chunks)} relevant chunks. Generating response...")
    
    # Generate response
    answer = pipeline.generate(query, chunks)
    
    print("\n--- Answer ---")
    print(answer)
    print("\n--- Citations ---")
    for idx, chunk in enumerate(chunks):
        title = chunk["metadata"]["source_title"]
        score = chunk["rrf_score"]
        snippet = chunk["content"][:120].replace('\n', ' ') + "..."
        print(f"[{idx+1}] {title} (RRF Score: {score:.4f})")
        print(f"    Snippet: \"{snippet}\"")

def main():
    load_dotenv()
    
    # Verify API key is present
    if not os.getenv("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY is not set in your .env file or environment.")
        print("Please grab an API Key from https://aistudio.google.com/ and add it to your .env file.")
        sys.exit(1)
        
    args = parse_args()
    
    pipeline = RAGPipeline()
    try:
        pipeline.initialize()
    except Exception as e:
        print(f"Error initializing RAG pipeline: {e}")
        sys.exit(1)

    if args.index:
        pipeline.index_documents("data/sources")
        print("Indexing completed. Run 'python3 main.py' to query.")
        return

    if args.query:
        run_query(pipeline, args.query, args.top_n)
    else:
        interactive_loop(pipeline, args.top_n)

if __name__ == "__main__":
    main()
