#!/usr/bin/env python3
"""
Local OpenAI-compatible image API smoke test.

Reads OPENAI_API_KEY and OPENAI_BASE_URL from ../.env by default, calls
/v1/images/generations, and saves the returned image when the provider works.

Examples:
  python scripts/test_openai_image_api.py
  python scripts/test_openai_image_api.py --model gpt-image-2 --output outputs/test.png
  python scripts/test_openai_image_api.py --prompt "一只橘猫在便利店门口喝汽水"
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_PROMPT = (
    "一张拍立得风格的亲密合照照片，室内用闪光灯拍摄，派对刚结束的氛围；"
    "画面温馨、搞笑、自然，略微运动模糊，带轻微胶片颗粒。"
)


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def normalize_base_url(base_url: str) -> str:
    base_url = base_url.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    return base_url


def summarize_error_body(body: str) -> str:
    if not body:
        return "<empty response body>"

    try:
        parsed = json.loads(body)
        return json.dumps(parsed, ensure_ascii=False, indent=2)[:2000]
    except json.JSONDecodeError:
        title_match = re.search(r"<title[^>]*>(.*?)</title>", body, flags=re.I | re.S)
        if title_match:
            return re.sub(r"\s+", " ", title_match.group(1)).strip()
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()[:2000]


def post_json(url: str, api_key: str, payload: dict, timeout: int) -> tuple[int, str]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "curl/8.7.1",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")


def extract_image_base64(response_body: str) -> str:
    parsed = json.loads(response_body)
    data = parsed.get("data") or []
    if not data:
        raise ValueError("Response JSON has no data array")

    first = data[0]
    if first.get("b64_json"):
        return first["b64_json"]

    if first.get("url"):
        raise ValueError(f"Provider returned image URL instead of base64: {first['url']}")

    raise ValueError(f"No b64_json/url found in first data item: {json.dumps(first, ensure_ascii=False)[:500]}")


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    api_server_dir = script_dir.parent
    load_dotenv(api_server_dir / ".env")

    parser = argparse.ArgumentParser(description="Test an OpenAI-compatible image generation API locally.")
    parser.add_argument("--base-url", default=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"))
    parser.add_argument("--api-key", default=os.environ.get("OPENAI_API_KEY", ""))
    parser.add_argument("--model", default=os.environ.get("DEFAULT_MODEL", "gpt-image-1").split("/")[-1])
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--size", default="1024x1024")
    parser.add_argument("--quality", default="auto")
    parser.add_argument("--output-format", default="png", choices=["png", "jpeg", "webp"])
    parser.add_argument("--output", default="outputs/openai-image-test.png")
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--minimal", action="store_true", help="Send only model and prompt, matching the simplest SDK example.")
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: OPENAI_API_KEY is missing. Put it in api-server/.env or pass --api-key.", file=sys.stderr)
        return 2

    base_url = normalize_base_url(args.base_url)
    endpoint = f"{base_url}/images/generations"
    payload = {
        "model": args.model,
        "prompt": args.prompt,
    }

    if not args.minimal:
        payload.update({
            "n": 1,
            "size": args.size,
        })

    if args.model.startswith("gpt-image") and not args.minimal:
        payload.update({
            "quality": args.quality,
            "output_format": args.output_format,
            "background": "auto",
        })
    elif not args.model.startswith("gpt-image") and not args.minimal:
        payload["response_format"] = "b64_json"

    print(f"Endpoint: {endpoint}")
    print(f"Model: {args.model}")
    print(f"Prompt: {args.prompt[:120]}{'...' if len(args.prompt) > 120 else ''}")
    print("Sending request...")

    start = time.time()
    try:
        status, body = post_json(endpoint, args.api_key, payload, args.timeout)
    except TimeoutError:
        print(f"ERROR: request timed out after {args.timeout}s")
        return 1
    except Exception as exc:
        print(f"ERROR: request failed: {exc}")
        return 1

    elapsed = time.time() - start
    print(f"HTTP status: {status} ({elapsed:.1f}s)")

    if status < 200 or status >= 300:
        print("Provider error response:")
        print(summarize_error_body(body))
        return 1

    try:
        image_b64 = extract_image_base64(body)
        image_bytes = base64.b64decode(image_b64)
    except Exception as exc:
        print(f"ERROR: could not extract image from response: {exc}")
        print("Response summary:")
        print(summarize_error_body(body))
        return 1

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = api_server_dir / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)

    print(f"SUCCESS: saved image to {output_path}")
    print(f"Bytes: {len(image_bytes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
