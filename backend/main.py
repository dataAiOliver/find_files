from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
import logging, json, traceback
from datetime import datetime
from typing import Dict, Any, Optional
import os
import mimetypes
from pydantic import BaseModel
from common.mongodb import get_mongo_collection, get_filter2query
from langchain_openai import AzureChatOpenAI
from langchain_ollama.llms import OllamaLLM
from dotenv import load_dotenv

# Load environment variables
load_dotenv("config.env")

BACKEND_HOST = os.getenv('BACKEND_HOST')
BACKEND_PORT = int(os.getenv('BACKEND_PORT'))
FRONTEND_HOST = os.getenv('FRONTEND_HOST')
FRONTEND_PORT = int(os.getenv('FRONTEND_PORT'))

# Construct CORS_ORIGIN from frontend host and port
CORS_ORIGIN = f'http://{FRONTEND_HOST}:{FRONTEND_PORT}'

MONGODB_COLLECTION_NAME = os.getenv('MONGODB_COLLECTION_NAME')
DUMMY_FILE = os.getenv('DUMMY_FILE')

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

max_files = 1000

with open("config/path2type.json", "r") as f:
    path2type = json.load(f)
collection = get_mongo_collection(
    MONGODB_COLLECTION_NAME, drop_collection=False
)


@app.get("/")
async def read_root():
    logger.info("Root endpoint accessed")
    return {"status": "running"}


@app.post("/api/files")
async def get_files(request: Request):
    body = await request.json()
    filter_dict = body.get("filter", {})

    logger.info(f"Received filter: {filter_dict}")

    if not filter_dict:
        logger.info("No filter provided, returning top 10 files.")
        results = list(collection.find().limit(max_files))
        logger.info(f"results: {results[0]}")
        logger.info(f"results len: {len(results)}")
        return results

    try:
        query = get_filter2query(filter_dict, path2type)
        logger.info(f"MongoDB query: {query}")
        results = list(collection.find(query))
        if len(results) == 0: return []
        logger.info(f"results: {results[0]}")
        logger.info(f"results len: {len(results)}")
        return results

    except Exception as e:
        logger.error(f"Error processing filter: {e}")
        logger.error(traceback.format_exc())
        results = list(collection.find().limit(max_files))
        return results


@app.get("/api/categories")
async def get_categories():
    """Return all available keys from path2type"""
    return list(path2type.keys())


@app.get("/api/filter-suggestions")
async def get_filter_suggestions(prefix: str):
    """Get filter key suggestions based on the current input prefix"""
    suggestions = []
    prefix = prefix.lower()
    for key in path2type.keys():
        if prefix in key.lower():
            suggestions.append({"key": key, "type": path2type[key]})
    return suggestions


def get_nested_value(obj: Dict[str, Any], path: str) -> Any:
    """Get a value from a nested dictionary using a dot-separated path"""
    current = obj
    for part in path.split("."):
        if isinstance(current, dict):
            if part in current:
                current = current[part]
            else:
                return None
        else:
            return None
    return current


@app.post("/api/recalculate")
async def recalculate_files(request: Request):
    """Recalculate files based on selected keys"""
    try:
        body = await request.json()
        files = body.get("files", [])
        keys = body.get("keys", [])

        logger.info(f"Recalculating files with keys: {keys}")
        logger.info(f"Number of files to process: {len(files)}")

        # TODO: Add your recalculation logic here
        # The function receives:
        # - files: list of current files
        # - keys: list of selected keys from path2type

        return files  # For now, just return the input files

    except Exception as e:
        logger.error(f"Error in recalculation: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


class ChatMessage(BaseModel):
    message: str
    fileIds: list[str]
    chatHistory: list[dict]

fn_dummyfile = DUMMY_FILE
logger.info(f"READ FILE {fn_dummyfile}")
with open(
    "/Users/oliverkohn/repositories/datasphereAI/find_files/backend/data/dummyfile.txt",
    "r",
) as f:
    dummyfile = f.read()

@app.post("/api/chat")
async def chat(request: Request):
    """Chat endpoint that processes messages and returns responses."""
    try:
        data = await request.json()
        message = data.get('message', '')
        file_ids = data.get('fileIds', [])
        messages = data.get('chatHistory', [])

        logger.info(f"Previous messages: {messages}")
        logger.info(f"New message: {message}")


        system_prompt = f"""Your task is to answer questions based on below document. Be polite. This is the document: {dummyfile}"""

        messages = [{"role": "system", "content": system_prompt}, *messages]
        logger.info(f"Full chat history with system prompt: {messages}")
        llm_llama32_3b = OllamaLLM(model="llama3.2:3b", temperature=0)
        response = llm_llama32_3b.invoke(messages)
        logger.info(f"LLM response: {response}")

        return response  # Return the string response directly

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/content")
async def get_file_content(filepath: str):
    """Get file content using filepath."""
    try:
        # Ensure the filepath is valid and exists
        if not filepath:
            raise HTTPException(status_code=400, detail="Filepath is required")
            
        abs_path = os.path.abspath(filepath)
        logger.info(f"Requested file: {abs_path}")
        
        if not os.path.exists(abs_path):
            raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
            
        # Get the file's mime type
        content_type, _ = mimetypes.guess_type(abs_path)
        if not content_type:
            # Set default content types based on extension
            ext = os.path.splitext(abs_path)[1].lower()
            content_types = {
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.txt': 'text/plain',
                '.json': 'application/json',
                '.js': 'text/javascript',
                '.py': 'text/plain'
            }
            content_type = content_types.get(ext, 'application/octet-stream')

        # For text files, return the content directly
        if content_type.startswith('text/'):
            with open(abs_path, 'r') as f:
                content = f.read()
            return Response(content=content, media_type=content_type)
            
        # For binary files (PDF, DOCX, etc.), use FileResponse with Content-Disposition header
        return FileResponse(
            abs_path,
            media_type=content_type,
            filename=os.path.basename(abs_path),
            headers={"Content-Disposition": "inline"}  # This tells the browser to display inline if possible
        )
        
    except Exception as e:
        logger.error(f"Error serving file content: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
