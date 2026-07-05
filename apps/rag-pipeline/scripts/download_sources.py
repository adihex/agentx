#!/usr/bin/env python3
import os
import re
import sys
import json
import subprocess
from pathlib import Path
from tqdm import tqdm

NOTEBOOK_ID = "ead71b1a-0aef-4fa8-9a84-5c599aa6ab73"
NLM_PATH = "/Users/adityabalakrishnan/.local/bin/nlm"

def sanitize_filename(name):
    # Keep alphanumeric characters, spaces, dots, dashes, underscores
    sanitized = re.sub(r'[^a-zA-Z0-9\s\.\-_]', '_', name)
    # Avoid extra spaces/underscores
    sanitized = re.sub(r'\s+', ' ', sanitized)
    sanitized = re.sub(r'_+', '_', sanitized)
    # Strip leading/trailing whitespaces and periods
    sanitized = sanitized.strip(" ._")
    if not sanitized:
        return "unnamed_source"
    # Limit length to avoid OS filename limits
    return sanitized[:150]

def main():
    print("=== NotebookLM Source Downloader ===")
    
    # 1. Check if nlm exists
    if not os.path.exists(NLM_PATH):
        print(f"Error: nlm CLI not found at {NLM_PATH}", file=sys.stderr)
        print("Please check your installation.", file=sys.stderr)
        sys.exit(1)
        
    # 2. Setup paths
    out_dir = Path("data/sources")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # 3. Fetch sources from the notebook
    print(f"Fetching source list for notebook {NOTEBOOK_ID}...")
    try:
        result = subprocess.run(
            [NLM_PATH, "source", "list", NOTEBOOK_ID, "--json"],
            capture_output=True,
            text=True,
            check=True
        )
        sources = json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print("Failed to run nlm source list command:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("Failed to parse JSON output from nlm source list:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        sys.exit(1)
        
    print(f"Found {len(sources)} sources in notebook.")
    
    # 4. Download content for each source
    downloaded = 0
    skipped = 0
    
    for src in tqdm(sources, desc="Downloading sources"):
        src_id = src.get("id")
        title = src.get("title", "unnamed")
        
        if not src_id:
            continue
            
        filename = sanitize_filename(title) + ".txt"
        file_path = out_dir / filename
        
        # Incremental download: skip if file already exists and is non-empty
        if file_path.exists() and file_path.stat().st_size > 0:
            skipped += 1
            continue
            
        try:
            # Download directly using the --output flag of nlm source content
            subprocess.run(
                [NLM_PATH, "source", "content", src_id, "--output", str(file_path)],
                capture_output=True,
                text=True,
                check=True
            )
            downloaded += 1
        except subprocess.CalledProcessError as e:
            print(f"\nFailed to download source {title} ({src_id}):", file=sys.stderr)
            print(e.stderr, file=sys.stderr)
            
    print(f"\nFinished processing sources!")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped (already exists): {skipped}")
    print(f"Total files in {out_dir}: {len(list(out_dir.glob('*.txt')))}")

if __name__ == "__main__":
    main()
