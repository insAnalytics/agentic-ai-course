"""
Rebuild, from the lesson pages themselves, the course code the Module 7 runs import, so the agent that
runs on Colab is the code learners read:

    tokens.py  Module 4's recap tokens.py  (COUNT_TOKENS)
    fake.py    Module 4's recap fake.py    (REACT_FAKE_CLIENT + WINDOWED_CLIENT)
    m4.py      Module 4's whole library    (Lesson 12 recap, LIB_PY)
    m5.py      Module 5's whole library    (Lesson 14 recap, LIB_PY; imports m4)
    m6loop.py  Module 6's checked loop     (CHECKED_AGENT: Checks, run_checked_agent)
    m7trace.py Module 7's tracing          (TRACER, then INSTRUMENT: traced_checks, TracedChat, instrument, config_hash)

    python scripts/eval/build_course_libs.py            # writes into scripts/eval/course/
    python scripts/eval/build_course_libs.py --check    # fails if a written file differs from the pages

Each file is assembled exactly as its page assembles it. Run --check in CI after any edit to those pages.
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "course"
MODULES = ROOT / "src" / "content" / "modules"
FAKE_TS = ROOT / "src" / "lib" / "fakeClient.ts"
RELIABILITY_TS = ROOT / "src" / "lib" / "reliabilityData.ts"
EVAL_TS = ROOT / "src" / "lib" / "evalData.ts"
M4_RECAP = MODULES / "04-context-and-memory" / "12-assembling-the-context-step" / "05-recap-practice.mdx"
M5_RECAP = MODULES / "05-rag-systems" / "14-context-step" / "06-recap-practice.mdx"


def raw_string(path: Path, name: str) -> str:
    """The value of `export const NAME = String.raw\\`...\\``, with the page's ${"..."} escapes undone."""
    source = path.read_text(encoding="utf-8")
    match = re.search(rf"export const {name} = String\.raw`", source)
    if match is None:
        raise SystemExit(f"{name} not found as a String.raw constant in {path}")
    i, out = match.end(), []
    while source[i] != "`":
        if source.startswith('${"', i):
            end = source.index('"}', i)
            # the escapes are JS string literals such as "`" or "\\"
            out.append(source[i + 3:end].encode().decode("unicode_escape"))
            i = end + 2
        else:
            out.append(source[i])
            i += 1
    return "".join(out)


def build() -> dict[str, str]:
    react_fake = raw_string(FAKE_TS, "FAKE_CLIENT") + raw_string(FAKE_TS, "REACT_CLIENT_UPGRADE")
    return {
        "tokens.py": "# the token estimate used throughout this module -- read-only\n"
                     + raw_string(FAKE_TS, "COUNT_TOKENS").lstrip(),
        "fake.py": "# the fake LLM client used throughout this course, with the windowed-client upgrade -- read-only\n"
                   "from tokens import count_tokens\n" + react_fake.lstrip() + raw_string(FAKE_TS, "WINDOWED_CLIENT"),
        "m4.py": raw_string(M4_RECAP, "LIB_PY"),
        "m5.py": raw_string(M5_RECAP, "LIB_PY"),
        "m6loop.py": raw_string(RELIABILITY_TS, "CHECKED_AGENT"),
        # the instrumentation the main runs use, exactly as Lesson 2 concept 3 shows it (INSTRUMENT = TRACED_CHECKS
        # + INSTRUMENT_WRAPPERS); json and Checks are globals there, so they're imported here
        "m7trace.py": "import json\n\nfrom m6loop import Checks\n\n" + raw_string(EVAL_TS, "TRACER") + "\n\n"
                      + raw_string(EVAL_TS, "TRACED_CHECKS") + "\n\n" + raw_string(EVAL_TS, "INSTRUMENT_WRAPPERS"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = build()
    if args.check:
        stale = [name for name, text in files.items()
                 if not (OUT / name).exists() or (OUT / name).read_text(encoding="utf-8") != text]
        if stale:
            sys.exit(f"out of date with the lesson pages: {', '.join(stale)}")
        print("course libraries match the lesson pages")
        return
    OUT.mkdir(exist_ok=True)
    for name, text in files.items():
        (OUT / name).write_text(text, encoding="utf-8")
    print(f"wrote {', '.join(files)} to {OUT}")


if __name__ == "__main__":
    main()
