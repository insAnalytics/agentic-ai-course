/**
 * Python source for the canned "web" (a search index and a few pages) used by
 * every demo and graded exercise in Module 3 Lesson 9 (web access for agents),
 * since the course's sandbox can't make network requests. Demos load it as
 * `setupCode`; the exercises ship it as a read-only `web.py` tab. Concept 1
 * also shows this source as a static code block, which must stay
 * byte-identical to this constant. See architecture.md §4.1.
 */
export const WEB_STANDINS = String.raw`# a small, canned slice of "the web", shared by every demo in this lesson
SEARCH_INDEX = [
    {"title": "Choosing a Claude model for agents", "url": "https://docs.example.com/models/choosing",
     "snippet": "Guidance on picking between Opus, Sonnet and Haiku for agent workloads, by cost and latency."},
    {"title": "Claude Haiku pricing and rate limits", "url": "https://docs.example.com/models/haiku-pricing",
     "snippet": "Per-token pricing, rate limits and batch discounts for Claude Haiku."},
    {"title": "Agent registry: naming conventions", "url": "https://wiki.example.com/registry/naming",
     "snippet": "Agent names are lowercase, end in _agent, and use underscores."},
    {"title": "Ten tips for faster agents", "url": "https://blog.example.com/faster-agents",
     "snippet": "Caching, smaller models and parallel tool calls: practical ways to cut agent latency."},
]

PAGES = {
    "https://wiki.example.com/registry/naming": """<!DOCTYPE html>
<html><head><title>Agent registry: naming conventions</title>
<style>body { font-family: sans-serif; } nav a { color: #336; } .banner { padding: 20px; }</style>
<script>window.analytics = { track: function(e) { console.log(e); } }; analytics.track("pageview");</script>
</head><body>
<nav><a href="/">Home</a> | <a href="/registry">Registry</a> | <a href="/help">Help</a> | <a href="/login">Log in</a></nav>
<div class="banner">We use cookies to improve your experience. <a href="/cookies">Manage preferences</a></div>
<main>
<h1>Naming conventions</h1>
<p>Agent names are lowercase, end in <code>_agent</code>, and use underscores between words.</p>
<p>Names must be unique across the whole registry, and can't be reused after an agent is deleted.</p>
</main>
<footer>&copy; 2026 Example Corp. <a href="/privacy">Privacy</a> | <a href="/terms">Terms</a></footer>
<script>document.querySelectorAll("a").forEach(function(a) { a.addEventListener("click", function() { analytics.track("click"); }); });</script>
</body></html>""",
}
`;
