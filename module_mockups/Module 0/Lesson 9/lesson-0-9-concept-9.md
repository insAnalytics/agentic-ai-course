# Module 0, Lesson 9 — Concept 9: Authentication

> **Sandbox note:** same caveat as Concepts 2 and 5 — this concept's
> exercise is written against `TestClient`-style checks as the intended
> grading mechanism, regardless of the eventual execution approach.

---

## Restricting who's allowed to call an endpoint

[Lesson 8's isolation motivation](→ Module 0, the Docker lesson, why containers concept, a second different reason explanation) restricted what running code can *access*. Authentication is the analogous concern at the API layer: restricting *who's allowed to call an endpoint in the first place* — a real concern the moment an API is reachable by anyone on the network, not just trusted local code.

---

## API key auth with `Depends()`

The simplest real pattern: a shared secret, checked on every request,
implemented as [a `Depends()`-based dependency used purely for its side effect](→ this lesson, dependency injection concept, the dependency used only for its side effect explanation):

```python
from fastapi import Depends, Header, HTTPException

API_KEY = "sk-agent-registry-prod-key"

def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid or missing API key")

@app.get("/agents", dependencies=[Depends(verify_api_key)])
def list_agents():
    return {"agents": []}
```

A request without a valid `X-Api-Key` header never reaches
`list_agents` at all — `verify_api_key` raises before it, exactly the
same `HTTPException`-based rejection [covered earlier in this lesson](→ this lesson, response models and exception handling concept, the HTTPException explanation), just now gating access rather than reporting a "not found." Applying this to every route that needs protection just means adding the same `dependencies=[Depends(verify_api_key)]` to each one — or, [as covered in the next concept](→ this lesson, building a real app concept), attaching it once to an entire `APIRouter` instead of repeating it per-route.

This is real, but limited: one shared key means every legitimate caller
has equal, undifferentiated access, and revoking access for one caller
means changing the key for everyone.

---

## A look at OAuth2 and JWT

The more complete, standard pattern for anything beyond a single shared
secret: a login endpoint that verifies real credentials and issues a
**JWT** (JSON Web Token) — a signed, self-contained token a client then
sends on every subsequent request instead of a raw password.

```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_and_verify_jwt(token)   # verifies the signature, extracts the user
    if user is None:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    return user

@app.get("/agents")
def list_agents(user: dict = Depends(get_current_user)):
    return {"agents": [], "requested_by": user["username"]}
```

A JWT is three base64-encoded parts — `header.payload.signature` —
where the payload holds claims like the username and an expiration
time, and the signature (created with a server-side secret) proves the
token hasn't been tampered with. Worth connecting directly back to
[statelessness, one of REST's guiding principles from the start of this lesson](→ this lesson, REST API fundamentals concept, the guiding principles explanation): the server doesn't need to remember who's logged in between requests at all — everything needed to verify a request travels *in* the token itself, on every request, which is exactly what a stateless API requires.

This course doesn't implement the full token-issuing flow in depth —
libraries like `python-jose` or `PyJWT` handle the actual encoding and
signature verification — but the shape is worth recognizing: `Depends()`
is still the mechanism doing the work, exactly as in the API key
version; only what's being checked, and how much information it carries,
has grown more sophisticated.

---

## Quiz cards

> **Q1.** What does authentication restrict, that isolation (from the
> Docker lesson) doesn't?
> - A) They're the same concern, just different names
> - B) Isolation restricts what running code can access; authentication restricts who's allowed to call an endpoint in the first place ✅
> - C) Authentication only matters for local development, never a deployed API
> - D) Isolation is a subset of authentication

> **Q2.** In the API key example, what happens to a request missing a
> valid `X-Api-Key` header?
> - A) It reaches `list_agents` normally, with `x_api_key` set to `None`
> - B) `verify_api_key` raises an `HTTPException` before `list_agents` ever runs, since it's declared as a dependency on that route ✅
> - C) It's silently logged but still processed normally
> - D) The server crashes with an unhandled error

> **Q3.** What's a real limitation of a single shared API key, compared
> to per-user credentials?
> - A) There's no real limitation — it's equally capable
> - B) Every legitimate caller has equal, undifferentiated access, and revoking access for one caller means changing the key for everyone ✅
> - C) API keys can't be sent as HTTP headers
> - D) API keys only work with `GET` requests

> **Q4.** What does a JWT's payload typically contain, and what proves
> it hasn't been tampered with?
> - A) The user's raw password, protected by HTTPS alone
> - B) Claims like the username and expiration time; a signature, created with a server-side secret, proves the token's integrity ✅
> - C) Nothing — a JWT is just a random string with no internal structure
> - D) The entire database record for that user

> **Q5.** How does JWT-based authentication connect back to REST's
> statelessness principle from earlier in this lesson?
> - A) It doesn't — JWTs require the server to remember every logged-in user
> - B) The server doesn't need to remember anything about who's logged in between requests — everything needed to verify the request travels in the token itself, every time ✅
> - C) Statelessness means authentication isn't possible in a REST API
> - D) JWTs are only used in non-RESTful APIs

---

## Applied sandbox exercise 2

*(an endpoint gated behind reusable API key auth via `Depends()`)*

*Task shown to learner:* Implement a `verify_api_key` dependency
checking an `X-Api-Key` header against a known value (`"secret-key-123"`),
raising `HTTPException(status_code=401, detail="invalid or missing API key")`
when it doesn't match. Apply it to a `GET /agents` route (returning
`{"agents": ["research_agent", "support_agent"]}` on success) using
`dependencies=[Depends(verify_api_key)]`.

*Grading (via `TestClient`-style requests):*
```python
no_key = client.get("/agents")
assert no_key.status_code == 401

wrong_key = client.get("/agents", headers={"X-Api-Key": "wrong"})
assert wrong_key.status_code == 401

valid = client.get("/agents", headers={"X-Api-Key": "secret-key-123"})
assert valid.status_code == 200
assert valid.json() == {"agents": ["research_agent", "support_agent"]}
```

*Hint (shown on request):* `verify_api_key(x_api_key: str = Header(default=None))`
compares `x_api_key` against the known secret and raises if it doesn't
match. Since this dependency is only used for its side effect (rejecting
bad requests), attach it via `dependencies=[Depends(verify_api_key)]` on
the route decorator, not as a named function parameter on the route
itself.

*Correct answer + explanation (shown on failure, if requested):*
```python
from fastapi import FastAPI, Depends, Header, HTTPException

app = FastAPI()

API_KEY = "secret-key-123"

def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid or missing API key")

@app.get("/agents", dependencies=[Depends(verify_api_key)])
def list_agents():
    return {"agents": ["research_agent", "support_agent"]}
```
This is the minimal, complete shape of API key auth: one dependency
function, reusable across any route that needs the same protection,
rejecting unauthorized requests before the route's own logic ever runs
— the same `Depends()` mechanism from the previous concept, now applied
to the security concern this lesson opened with.

---

*(End of Concept 9. This lesson continues with Concept 10 — building a
real app: `APIRouter`, middleware, startup/shutdown events, and
background tasks — drafted separately.)*
