# Module 3, Lesson 9 — Concept 2: Getting the useful part out of a page

---

## Most of a page isn't content

[The previous concept](→ this lesson, search and fetch two tools two jobs concept) fetched a page of about 1,000 characters to answer a question that needed about 150. That ratio is typical. A real page is mostly machinery: stylesheets, scripts, navigation menus, cookie banners, footers, tracking code. On a large news or documentation site, the actual article can be a small fraction of the HTML.

Sending all of it to the model is [Lesson 3's oversized-result problem](→ this module, shaping what tools return lesson, why a huge tool result hurts concept) at its worst: every character costs tokens, it stays in the conversation for every later step, and the one paragraph that matters is buried among markup the model has to read around. A fetch tool worth using returns the page's *text*, not its HTML.

## Extracting text with the standard library

Python's standard library includes an HTML parser, `html.parser.HTMLParser`. You subclass it and override three methods, and it calls them as it reads through the page: `handle_starttag` for each opening tag like `<p>`, `handle_endtag` for each closing tag, and `handle_data` for the text in between. That's enough to build a simple extractor:

- **Skip whole sections** whose content is never useful: `<script>`, `<style>`, `<nav>`, `<footer>` and `<head>`. A counter tracks when we're inside one, so text there is dropped.
- **Start a new line at block tags** such as `<p>`, `<h1>` and `<li>`, so paragraphs stay separate.
- **Keep everything else,** then collapse runs of whitespace and drop blank lines.

```python
from html.parser import HTMLParser

SKIP_TAGS = {"script", "style", "nav", "footer", "head"}
BLOCK_TAGS = {"p", "h1", "h2", "h3", "li", "div", "main", "section", "article", "br", "tr"}

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip_depth = 0      # > 0 while inside a tag whose content we drop
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        elif tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            self.skip_depth -= 1
        elif tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.skip_depth == 0:
            # a newline inside text is just whitespace in HTML; only block tags start new lines
            self.parts.append(data.replace("\n", " "))

def extract_text(html: str) -> str:
    extractor = TextExtractor()
    extractor.feed(html)
    raw = "".join(extractor.parts)
    # collapse runs of spaces within lines, and drop blank lines
    lines = [" ".join(line.split()) for line in raw.split("\n")]
    return "\n".join(line for line in lines if line)
```
```python
from web import PAGES
from c2core import extract_text

page = PAGES["https://wiki.example.com/registry/naming"]
text = extract_text(page)
print(text)
print(f"\n{len(page)} characters of HTML -> {len(text)} characters of text")
```
```
We use cookies to improve your experience. Manage preferences
Naming conventions
Agent names are lowercase, end in _agent, and use underscores between words.
Names must be unique across the whole registry, and can't be reused after an agent is deleted.

1039 characters of HTML -> 252 characters of text
```
*(runs live, shows output — read-only demo snippet, not graded)*

From 1,039 characters to 252, with the scripts, styles, navigation and footer gone. One detail in `handle_data` matters more than it looks: a line break *inside* a paragraph's text is just whitespace in HTML, so it's replaced with a space. Only block tags start new lines. Without that, a paragraph written across several lines of source would come out broken into fragments.

## Where tag rules run out

The cookie banner survived. It sits in an ordinary `<div>`, and nothing about a `<div>` says "this is a banner, not content". Rules based on tag names only get you so far, because pages use the same tags for everything.

Many pages help, though. HTML has a `<main>` tag meaning "the main content of this page", and well-built pages wrap their real content in it (or in `<article>`). When a page has one, keeping only what's inside it is a much better rule: the banner, the navigation and everything else outside it disappear together. That improvement is this concept's exercise.

For production use, there are dedicated libraries that go much further, scoring each part of a page by how much it looks like real content rather than boilerplate, and handling the many ways sites are actually built. And as [the previous concept](→ this lesson, search and fetch two tools two jobs concept) mentioned, provider-run fetch tools do this extraction for you. What's worth knowing either way is what the extraction step is for, and what it can't know: it decides what the model gets to read, so a bad extractor either drops the answer or buries it.

---

## Quiz cards

> **Q1.** Why should a fetch tool return a page's text rather than its raw HTML?
> - A) The model can't read HTML syntax at all
> - B) Most of a page's HTML is scripts, styles, navigation and boilerplate that cost tokens and bury the actual content ✅
> - C) HTML is too large for the model API to accept
> - D) Raw HTML is a security risk, and text isn't
>
> *Explanation:* It's Lesson 3's result-size problem. Text extraction keeps the part that can answer a question and drops the machinery around it.

> **Q2.** Why does the extractor replace newlines inside text with spaces?
> - A) In HTML, a line break inside text is just whitespace; only block tags like `<p>` should start a new line ✅
> - B) The model can't read newline characters
> - C) Newlines would break the JSON result
> - D) It's needed for `HTMLParser` to work
>
> *Explanation:* Page source often wraps long paragraphs across lines. Keeping those breaks would split one paragraph into fragments.

> **Q3.** The extractor skips `<nav>` and `<footer>`, but a cookie banner in a `<div>` still gets through. Why?
> - A) The parser can't read `<div>` tags
> - B) The banner was inside the `<head>`
> - C) Banners are always kept for legal reasons
> - D) A `<div>` carries no meaning about its content, so tag-name rules can't tell a banner from real text ✅
>
> *Explanation:* Pages use generic tags for everything. That's why the `<main>` tag, which does carry meaning, is such a useful signal when a page has one.

> **Q4.** What does keeping only the text inside a page's `<main>` tag gain?
> - A) It removes everything outside the page's declared main content, banners and menus included, in one rule ✅
> - B) It makes the parser run faster
> - C) It guarantees the answer is found
> - D) It works even on pages without a `<main>` tag
>
> *Explanation:* `<main>` is the page's own statement of where its content is. When it's present, it's a far better guide than any list of tags to skip.

---

## Applied sandbox exercise

*(graded — a text extractor that prefers the main content)*

**Task shown to learner:** Complete `TextExtractor(only_main)` and `extract_text(html, max_chars)`:

- **Skip** any text inside `script`, `style`, `nav`, `footer` or `head`.
- **If `only_main` is true,** keep only text inside a `<main>` tag. `extract_text` sets it to true when the page contains `<main` (case-insensitive).
- **Start a new line** at the start and end of every tag in `BLOCK_TAGS`, and turn newlines *inside* text into spaces.
- **Clean up:** collapse runs of whitespace within each line, and drop empty lines.
- **Truncate** text longer than `max_chars` to `max_chars` characters, adding a marker that it was truncated.

**Starter code:**
```python
from html.parser import HTMLParser

SKIP_TAGS = {"script", "style", "nav", "footer", "head"}
BLOCK_TAGS = {"p", "h1", "h2", "h3", "li", "div", "main", "section", "article", "br", "tr"}

class TextExtractor(HTMLParser):
    def __init__(self, only_main: bool):
        super().__init__()
        # TODO: set up whatever state the handlers need
        ...

    def handle_starttag(self, tag, attrs):
        # TODO
        ...

    def handle_endtag(self, tag):
        # TODO
        ...

    def handle_data(self, data):
        # TODO
        ...

def extract_text(html: str, max_chars: int = 2000) -> str:
    # TODO: run the extractor, clean up the text, and truncate if needed
    ...
```

**Hidden tests:**
```python
naming = PAGES["https://wiki.example.com/registry/naming"]

# 1. with a <main>, only its text is kept: the answer stays, the banner, nav and footer go
text = extract_text(naming)
assert text.splitlines() == [
    "Naming conventions",
    "Agent names are lowercase, end in _agent, and use underscores between words.",
    "Names must be unique across the whole registry, and can't be reused after an agent is deleted.",
], text
assert "cookies" not in text and "Privacy" not in text and "analytics" not in text

# 2. without a <main>, everything except skipped tags is kept, including a div's text
no_main = "<html><head><title>T</title></head><body><nav>Menu</nav><div>Intro text</div><p>Body text</p><script>x()</script></body></html>"
assert extract_text(no_main).splitlines() == ["Intro text", "Body text"]

# 3. script and style inside <main> are still dropped
inner = "<main><p>Keep this</p><script>track()</script><style>.a{}</style><p>And this</p></main>"
assert extract_text(inner).splitlines() == ["Keep this", "And this"]

# 4. whitespace inside a line is collapsed, and blank lines are removed
messy = "<main><p>  lots    of\n   space  </p>\n\n\n<p>next</p></main>"
assert extract_text(messy) == "lots of space\nnext"

# 5. long text is truncated with a marker
long_page = "<main>" + "".join(f"<p>line {i} of a very long page</p>" for i in range(500)) + "</main>"
out = extract_text(long_page, max_chars=300)
assert "truncated" in out and len(out) < 360
```

**Hint (shown on request):** Two counters do all the work: `skip_depth` goes up at a skipped tag's start and down at its end, and `main_depth` does the same for `main`. In `handle_data`, drop the text if `skip_depth > 0`, or if `only_main` is set and `main_depth == 0`. Remember that `<main>` is itself a block tag, so check it for both counting and new lines.

**Reference solution:**
```python
class TextExtractor(HTMLParser):
    def __init__(self, only_main: bool):
        super().__init__()
        self.only_main = only_main
        self.skip_depth = 0
        self.main_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        if tag == "main":
            self.main_depth += 1
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            self.skip_depth -= 1
        if tag == "main":
            self.main_depth -= 1
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.skip_depth > 0:
            return
        if self.only_main and self.main_depth == 0:
            return
        # a newline inside text is just whitespace in HTML; only block tags start new lines
        self.parts.append(data.replace("\n", " "))

def extract_text(html: str, max_chars: int = 2000) -> str:
    extractor = TextExtractor(only_main="<main" in html.lower())
    extractor.feed(html)
    lines = [" ".join(line.split()) for line in "".join(extractor.parts).split("\n")]
    text = "\n".join(line for line in lines if line)
    if len(text) > max_chars:
        text = text[:max_chars] + f"\n... (page truncated at {max_chars} characters)"
    return text
```

**Explanation:** Test 1 is the payoff: on the naming page, the cookie banner that beat the simpler extractor is gone, because it sits outside `<main>`, and the three lines that answer the question are exactly what's left. Test 2 checks the fallback for pages with no `<main>`, and test 3 checks that scripts inside the main content are still dropped. Test 4 is the whitespace rule, including a line break inside a paragraph, and test 5 applies Lesson 3's truncation to whatever's left.

---

*(End of Concept 2. This lesson continues with Concept 3 — when fetching isn't enough: browsers and computer use.)*
