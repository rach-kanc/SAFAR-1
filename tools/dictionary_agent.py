from __future__ import annotations

import argparse
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path

import requests


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = PROJECT_ROOT / "templates"
OUTPUT_DIR = PROJECT_ROOT / "static" / "translators"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
LANGS = ("hi", "sa")
ATTRS_TO_CAPTURE = {"placeholder", "title", "aria-label", "alt", "content", "value"}
SKIP_TAGS = {"script", "style", "noscript"}
VALUE_INPUT_TYPES = {"button", "submit", "reset"}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def wants_translation(text: str) -> bool:
    return bool(re.search(r"[A-Za-z]", text))


def strip_jinja(source: str) -> str:
    source = re.sub(r"{#.*?#}", " ", source, flags=re.S)
    source = re.sub(r"{%.*?%}", " ", source, flags=re.S)
    source = re.sub(r"{{.*?}}", " ", source, flags=re.S)
    return source


class TemplateScanner(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.skip_depth = 0
        self.strings: set[str] = set()
        self.tag_stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        self.tag_stack.append(tag)
        if tag in SKIP_TAGS:
            self.skip_depth += 1
            return

        attr_map = {name.lower(): value for name, value in attrs if name}
        if "data-no-translate" in attr_map:
            return

        if tag == "meta" and attr_map.get("name", "").lower() == "description":
            content = normalize_text(attr_map.get("content") or "")
            if wants_translation(content):
                self.strings.add(content)

        for attr_name, attr_value in attr_map.items():
            if attr_name not in ATTRS_TO_CAPTURE:
                continue
            if attr_name == "value" and tag != "input":
                continue
            if attr_name == "value" and attr_map.get("type", "").lower() not in VALUE_INPUT_TYPES:
                continue
            cleaned = normalize_text(attr_value or "")
            if wants_translation(cleaned):
                self.strings.add(cleaned)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
        if self.tag_stack:
            self.tag_stack.pop()

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        cleaned = normalize_text(data)
        if wants_translation(cleaned):
            self.strings.add(cleaned)


def extract_strings(template_path: Path) -> list[str]:
    parser = TemplateScanner()
    parser.feed(strip_jinja(template_path.read_text(encoding="utf-8")))
    return sorted(parser.strings)


def translate_text(text: str, target: str) -> str:
    response = requests.get(
        TRANSLATE_URL,
        params={
            "client": "gtx",
            "sl": "en",
            "tl": target,
            "dt": "t",
            "q": text,
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload or not payload[0]:
        return text
    return "".join(part[0] for part in payload[0] if part and part[0]).strip() or text


def should_retry_translation(source: str, translated: str) -> bool:
    if translated != source:
        return False
    if source.isupper():
        return False
    if len(source) <= 2:
        return False
    return bool(re.search(r"[A-Za-z]{3,}", source))


def build_translations(strings: list[str], max_workers: int) -> dict[str, dict[str, str]]:
    translations = {lang: {} for lang in LANGS}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(translate_text, text, lang): (lang, text)
            for text in strings
            for lang in LANGS
        }
        for future in as_completed(future_map):
            lang, text = future_map[future]
            try:
                translations[lang][text] = future.result()
            except requests.RequestException:
                translations[lang][text] = text

    for lang in LANGS:
        for text in strings:
            if should_retry_translation(text, translations[lang][text]):
                try:
                    translations[lang][text] = translate_text(text, lang)
                except requests.RequestException:
                    pass
    return translations


def write_translator(page: str, translations: dict[str, dict[str, str]]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{page}.translator.js"
    hi_json = json.dumps(translations["hi"], ensure_ascii=False, indent=4, sort_keys=True)
    sa_json = json.dumps(translations["sa"], ensure_ascii=False, indent=4, sort_keys=True)
    output_path.write_text(
        "\n".join(
            [
                "window.SafarTranslator.boot({",
                f"  page: '{page}',",
                "  manualTranslations: {",
                f"    hi: {hi_json},",
                f"    sa: {sa_json},",
                "  },",
                "});",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan SAFAR templates and regenerate page-specific translator JS files."
    )
    parser.add_argument(
        "--page",
        default="all",
        help="Page name without .html, or 'all' to process every template.",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write generated translator files to static/translators.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=3,
        help="Parallel translation requests to make larger pages finish faster.",
    )
    parser.add_argument(
        "--max-strings",
        type=int,
        default=0,
        help="Optional limit for how many extracted English strings to translate.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    templates = sorted(TEMPLATE_DIR.glob("*.html"))
    if args.page != "all":
        templates = [TEMPLATE_DIR / f"{args.page}.html"]

    for template_path in templates:
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        page = template_path.stem
        strings = extract_strings(template_path)
        if args.max_strings > 0:
            strings = strings[: args.max_strings]
        print(f"[dictionary-agent] {page}: found {len(strings)} English strings")
        translations = build_translations(strings, max_workers=max(1, args.max_workers))

        if args.write:
            output_path = write_translator(page, translations)
            print(f"[dictionary-agent] wrote {output_path}")
        else:
            preview = {
                "page": page,
                "strings": strings[:10],
                "hi_preview": {key: translations["hi"][key] for key in strings[:3]},
                "sa_preview": {key: translations["sa"][key] for key in strings[:3]},
            }
            print(json.dumps(preview, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
