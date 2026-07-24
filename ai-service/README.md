# LostLens AI Service

A small, standalone FastAPI service that converts an image into a
normalized embedding vector using OpenCLIP. This is Milestone 1: it only
proves that the service can turn `{"imageUrl": "..."}` into an embedding.
It does not talk to the LostLens frontend, backend, database, or
Cloudinary — those integrations come later.

## Why OpenCLIP `ViT-B-32` / `laion2b_s34b_b79k`?

- **Embedding quality**: this checkpoint is trained on LAION-2B and
  reaches strong zero-shot performance (roughly 66% top-1 on
  ImageNet) — a large step up from older/smaller backbones, while still
  being practical to run without a GPU.
- **Inference speed**: the "32" in `ViT-B-32` is the patch size. A larger
  patch size means fewer tokens per image, which makes the forward pass
  noticeably faster than `ViT-B-16` or `ViT-L-14` — important on a
  CPU-only laptop.
- **Memory usage**: about 151M parameters (~350MB checkpoint). It loads
  and runs comfortably in a few hundred MB of RAM, no GPU required.

This is a good general-purpose default for local development. A larger
model (e.g. `ViT-L-14`) would likely improve embedding quality further,
at the cost of being several times slower and heavier — not the right
trade-off for this milestone.

## Requirements

- Python 3.11+
- Several GB of free disk space and a stable internet connection for the
  first-time install and model download (see the two notes below —
  both are things I only discovered by actually running this, not
  guesses)

## Setup

```bash
cd ai-service

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate      # on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Note: if you don't have an NVIDIA GPU

On Linux, `pip install torch` pulls in several NVIDIA CUDA runtime
packages as dependencies (`nvidia-cublas-cu12`, `nvidia-cudnn-cu12`,
etc.) **even on a machine with no GPU at all** — PyPI's default Linux
wheel assumes CUDA might be available and preloads those libraries at
import time regardless. This adds a large, unnecessary download (over
1GB) if you're only running on CPU.

If you don't have an NVIDIA GPU, install the CPU-only build instead —
it's a fraction of the size and this service runs identically on it
(`select_device()` in `app.py` already checks for CUDA/MPS and falls back
to CPU automatically):

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt   # installs everything else normally
```

### Note: the model downloads from Hugging Face Hub on first run

`open_clip` fetches the `ViT-B-32` / `laion2b_s34b_b79k` checkpoint from
`huggingface.co` the first time the server starts, then caches it
locally. If your network blocks that domain, startup will fail with a
clear download error. This is a one-time download per machine, not a
per-request dependency.

## Running the server

```bash
uvicorn app:app --reload --port 8000
```

The first request after starting the server will take longer than usual —
that's OpenCLIP downloading the `ViT-B-32` / `laion2b_s34b_b79k` checkpoint
to a local cache (`~/.cache/huggingface` or similar, depending on
platform). Subsequent runs reuse that cache and start faster.

## Example request

```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://raw.githubusercontent.com/pytorch/vision/main/test/assets/encode_jpeg/grace_hopper_517x606.jpg"}'
```

## Example response

```json
{
  "dimensions": 512,
  "embedding": [0.0123, -0.0456, 0.0789, "... 512 numbers total"]
}
```

## Error responses

| Situation | Status | Example detail |
|---|---|---|
| `imageUrl` isn't a valid URL at all | 422 | (FastAPI's standard validation error format) |
| URL is valid but can't be downloaded (DNS failure, timeout, 404, etc.) | 400 | `"Could not download image from URL: ..."` |
| Downloaded file is over 15MB | 400 | `"Image exceeds the 15MB size limit."` |
| Downloaded file isn't a valid/supported image | 400 | `"The URL did not point to a supported image format."` |
| Model inference fails unexpectedly | 500 | `"Failed to generate an embedding for this image."` |

## Project structure

```
ai-service/
├── app.py             # The entire service — model loading, download
│                       # logic, embedding logic, and the one API route.
├── requirements.txt    # Python dependencies.
├── README.md
└── .gitignore
```

Kept deliberately flat — there's exactly one endpoint and one model, so a
single file is easier to read than a multi-folder structure would be at
this size.
