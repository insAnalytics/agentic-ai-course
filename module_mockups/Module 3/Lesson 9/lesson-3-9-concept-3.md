# Module 3, Lesson 9 — Concept 3: When fetching isn't enough — browsers and computer use

---

## What a plain fetch can't do

The fetch tool from [this lesson's first concept](→ this lesson, search and fetch two tools two jobs concept) downloads a page's HTML and [extracts its text](→ this lesson, getting the useful part out of a page concept). That covers a lot of the web, and it has hard limits:

- **Pages built by JavaScript.** Many modern sites send almost empty HTML, then build the real content in the browser by running scripts. A fetch gets the empty shell. Even provider-run fetch tools, such as Anthropic's, don't render JavaScript-heavy pages.
- **Anything behind a login.** A fetch has no session, so it sees only the login page.
- **Anything that needs doing, not reading.** Filling in a form, clicking through a checkout, changing a setting in a web dashboard: these are actions, and a fetch only reads.

For those, an agent needs something that behaves like a person using a browser. There are two ways to give it that, and they differ in what the model *sees*.

## Browser automation: the model reads a structured page

A **browser automation** tool runs a real browser, usually with no visible window, and exposes actions as tools: go to a URL, click something, type into a field, go back. A library like Playwright drives the browser; the agent's tools wrap it.

The interesting design question is what the model gets back after each action, because a rendered page is not text. The widely used approach, and the default in Microsoft's Playwright MCP server, is an **accessibility snapshot**: a structured outline of the page built from the same information screen readers use. Each meaningful element appears with its role, its label, and a short reference the model can use in its next action:

```
- heading "Naming conventions" [level=1]
- paragraph: Agent names are lowercase, end in _agent, and use underscores between words.
- textbox "Proposed agent name" [ref=e7]
- button "Check name" [ref=e8]
- link "Back to registry" [ref=e9]
```
*(illustrative — the shape of an accessibility snapshot, simplified)*

To try a name, the model calls something like `browser_type(ref="e7", text="triage_agent")` and then `browser_click(ref="e8")`, and gets a fresh snapshot showing the result. The snapshot is compact, like the extracted text from the previous concept, but it keeps what an action needs: which things on the page can be clicked or typed into, and what they're called. And because the model refers to elements by reference rather than by position, its actions are precise.

## Computer use: the model looks at the screen

**Computer use** goes one step further. The model receives a *screenshot* of a whole desktop or browser window, and acts with mouse and keyboard actions: move to these coordinates, click, type these keys, scroll. Anthropic's API has a computer use tool for exactly this.

It's the most general option there is: anything a person can do on a screen, the agent can in principle do, including desktop applications with no web interface and no API at all. It's also the most expensive and least precise:

- **Screenshots cost many more tokens** than a structured snapshot, on every single step.
- **Clicking by coordinates can miss.** A button that moved a few pixels, a pop-up that appeared, or a page that hadn't finished loading turns into a wrong click.
- **Each step is slow,** since it's a screenshot, a model call, an action and another screenshot.

## Choosing: the most structured option that works

These options form a ladder. Each step down can do more, and each step down is slower, costlier and less reliable:

| Option | What the model works with | Use it when |
|---|---|---|
| A proper API or MCP server | structured data, from a documented interface | the service offers one |
| Fetch plus text extraction | a page's text | the content is readable without running scripts or logging in |
| Browser automation | an accessibility snapshot, with elements to act on | the page needs JavaScript, a login, or real clicks and typing |
| Computer use | screenshots, with mouse and keyboard | there's no structure to use at all, such as a desktop app |

The rule is to use the highest rung that can do the job. An agent that uses computer use to read a web page that has an API is paying the most for the least reliable version of something a single tool call could have done.

## What changes when the agent can act

Browser automation and computer use raise the stakes in a way fetching doesn't. Fetching reads; these tools **act**, often while logged in as someone:

- A click can buy something, send something, or delete something, and a wrong click is as real as a right one.
- A logged-in browser session carries the user's full access to that site. Whatever the agent is steered into doing, it does with that access.

So these tools are where [the approval gates in the least-privilege lesson](→ this module, designing for least privilege lesson) matter most. And they share one risk with every tool in this lesson, including the humble fetch: the agent is reading pages written by someone else. That's [the final concept](→ this lesson, everything from the web is untrusted input concept).

---

## Quiz cards

> **Q1.** A fetch of a product page returns almost no content, though the page looks full in a browser. What's the most likely reason?
> - A) The site blocks all automated requests
> - B) The page builds its content with JavaScript in the browser, and a fetch only gets the initial HTML ✅
> - C) The text extractor removed the content
> - D) The page is too large to fetch
>
> *Explanation:* Many sites send a near-empty shell and fill it in with scripts. Only something that runs a real browser sees the finished page.

> **Q2.** What is an accessibility snapshot?
> - A) A screenshot compressed for the model
> - B) The page's raw HTML with scripts removed
> - C) A structured outline of the page's elements, with roles, labels and references the model can act on ✅
> - D) A summary of the page written by another model
>
> *Explanation:* It's built from the same information screen readers use, so it's compact and keeps exactly what an action needs: what can be clicked or typed into, and what it's called.

> **Q3.** Why is computer use generally the last resort?
> - A) Screenshots cost far more tokens, coordinate clicks can miss, and each step is slow ✅
> - B) It can only operate web browsers
> - C) It requires the model to write code
> - D) It can't type text
>
> *Explanation:* It's the most general option, and pays for that generality in cost, speed and precision on every step.

> **Q4.** An agent needs the current balance from a banking service that offers a documented API. Which option fits best?
> - A) Computer use, since it can do anything
> - B) Browser automation, logged in as the user
> - C) Fetch plus text extraction of the account page
> - D) The API ✅
>
> *Explanation:* Use the most structured option that works. An API gives exact data through a documented interface, with none of the cost or fragility of driving a browser.

> **Q5.** Why do browser automation and computer use raise the stakes compared with fetching?
> - A) They're slower
> - B) They can take real actions, often with a logged-in user's full access, and a wrong action is as real as a right one ✅
> - C) They can't read pages
> - D) They cost more tokens
>
> *Explanation:* Cost and speed matter, but the real change is that the agent can now act. That's where approval gates and least privilege become essential.

---

*(End of Concept 3. This lesson continues with Concept 4 — everything from the web is untrusted input.)*
