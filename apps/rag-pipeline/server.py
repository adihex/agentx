import os
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="AgentX RAG Pipeline API", description="API for NotebookLM Integration and RAG Operations")

class ImportRequest(BaseModel):
    notebook_id: str
    mode: str  # "cli" or "enterprise"
    credentials: str | None = None

@app.post("/api/import/notebooklm")
def import_notebooklm(req: ImportRequest):
    """
    Import data from a NotebookLM notebook.
    Routes to either the local CLI push or the Enterprise API.
    """
    if not req.notebook_id:
        raise HTTPException(status_code=400, detail="notebook_id is required")

    if req.mode == "enterprise":
        # TODO: Implement Enterprise OAuth logic using google-genai or requests
        # Example:
        # url = f"https://notebooklm.googleapis.com/v1/workspaces/{req.notebook_id}/export"
        return {
            "status": "success", 
            "mode": "enterprise",
            "message": f"Enterprise import triggered for notebook {req.notebook_id}. (To be fully implemented with OAuth token)"
        }
    
    elif req.mode == "cli":
        # TODO: Accept push payload from the local CLI, or trigger local nlm command if running locally
        # Since this backend might be in the cloud, the CLI would push to this endpoint,
        # or if local, it could spawn a subprocess.
        return {
            "status": "success", 
            "mode": "cli",
            "message": f"CLI import endpoint ready for notebook {req.notebook_id}. Please run 'npx @agentx/zettel-import {req.notebook_id}' on your local machine to push data here."
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'cli' or 'enterprise'.")

@app.get("/_health")
def health_check():
    return {"status": "ok"}

# Add to main.py or run via `uvicorn server:app`
