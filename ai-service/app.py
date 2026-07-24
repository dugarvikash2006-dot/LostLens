"""
LostLens AI Service — Milestone 1

A small, standalone FastAPI service that turns an image (given as a URL)
into a normalized OpenCLIP embedding vector. This is intentionally the
smallest useful slice: no matching, no database, no queues — just
"give me an image URL, get back an embedding."
"""

from contextlib import asynccontextmanager
from dataclasses import dataclass
from io import BytesIO

import open_clip
import requests
import torch
from fastapi import FastAPI, HTTPException
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, HttpUrl

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# ViT-B-32 + laion2b_s34b_b79k: a strong, general-purpose CLIP checkpoint
# that's small and fast enough to run on a CPU-only laptop. See the README
# for the full reasoning behind this choice.
MODEL_NAME = "ViT-B-32"
PRETRAINED = "laion2b_s34b_b79k"

# Safety limits for the image download — an image URL is untrusted input.
DOWNLOAD_TIMEOUT_SECONDS = 10
MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class EmbedRequest(BaseModel):
    """Body for POST /embed. Pydantic's HttpUrl rejects malformed URLs
    automatically (FastAPI turns that into a 422 response) before our own
    code ever runs."""

    imageUrl: HttpUrl


class EmbedResponse(BaseModel):
    dimensions: int
    embedding: list[float]


# ---------------------------------------------------------------------------
# Model state
# ---------------------------------------------------------------------------


@dataclass
class ModelState:
    """Everything needed to run inference, loaded once at startup and
    reused for every request."""

    model: torch.nn.Module
    preprocess: object
    device: str


def select_device() -> str:
    """Pick the best available device: CUDA GPU, Apple Silicon (MPS),
    then fall back to CPU. Works whatever machine this happens to run on."""
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model() -> ModelState:
    """Loads the OpenCLIP model + its matching preprocessing pipeline.
    Called exactly once, at application startup."""
    device = select_device()

    model, _, preprocess = open_clip.create_model_and_transforms(
        MODEL_NAME, pretrained=PRETRAINED
    )
    model.eval()
    model.to(device)

    return ModelState(model=model, preprocess=preprocess, device=device)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the model once and stash it on app.state so every
    # request can reuse it without reloading anything.
    app.state.model_state = load_model()
    yield
    # Nothing to clean up on shutdown — no open connections, no files.


app = FastAPI(title="LostLens AI Service", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Image download + embedding logic
# ---------------------------------------------------------------------------


def download_image(url: str) -> Image.Image:
    """Downloads an image from a URL and returns it as a PIL Image.

    Streams the response so we can cap how much data we read, rather than
    trusting a potentially huge or slow remote file.
    """
    try:
        response = requests.get(url, timeout=DOWNLOAD_TIMEOUT_SECONDS, stream=True)
        response.raise_for_status()
    except requests.RequestException as error:
        raise ValueError(f"Could not download image from URL: {error}") from error

    chunks: list[bytes] = []
    total_bytes = 0

    for chunk in response.iter_content(chunk_size=8192):
        total_bytes += len(chunk)
        if total_bytes > MAX_IMAGE_BYTES:
            raise ValueError(
                f"Image exceeds the {MAX_IMAGE_BYTES // (1024 * 1024)}MB size limit."
            )
        chunks.append(chunk)

    try:
        image = Image.open(BytesIO(b"".join(chunks)))
        image.load()  # force full decode now, so corrupt files fail here, not later
    except UnidentifiedImageError as error:
        raise ValueError("The URL did not point to a supported image format.") from error

    # CLIP's preprocessing expects RGB — convert away from grayscale,
    # palette, or RGBA (e.g. transparent PNGs) so every image is handled
    # consistently.
    return image.convert("RGB")


def generate_embedding(image: Image.Image, model_state: ModelState) -> list[float]:
    """Runs the image through OpenCLIP and returns a normalized embedding
    as a plain Python list."""
    image_tensor = model_state.preprocess(image).unsqueeze(0).to(model_state.device)

    with torch.no_grad():
        features = model_state.model.encode_image(image_tensor)
        # Normalizing to unit length means embeddings can later be compared
        # with a plain dot product instead of full cosine similarity math —
        # useful for the matching feature this service will support later.
        features = features / features.norm(dim=-1, keepdim=True)

    return features.squeeze(0).cpu().tolist()


# ---------------------------------------------------------------------------
# API route
# ---------------------------------------------------------------------------


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    """
    Defined as a regular (sync) function rather than `async def`: the work
    below — downloading the image, running the model — is all blocking
    CPU/network work. FastAPI runs sync route handlers in a thread pool
    automatically, so this keeps the server responsive to other requests
    instead of blocking the single async event loop.
    """
    model_state: ModelState = app.state.model_state

    try:
        image = download_image(str(request.imageUrl))
    except ValueError as error:
        # Anything wrong with the URL or the image itself is the caller's
        # problem, not ours — a 400 says so clearly.
        raise HTTPException(status_code=400, detail=str(error)) from error

    try:
        embedding = generate_embedding(image, model_state)
    except Exception as error:
        # Anything unexpected during inference is our problem, not the
        # caller's — a 500 says so, without leaking internals.
        raise HTTPException(
            status_code=500, detail="Failed to generate an embedding for this image."
        ) from error

    return EmbedResponse(dimensions=len(embedding), embedding=embedding)
