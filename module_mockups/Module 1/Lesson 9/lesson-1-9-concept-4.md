# Module 1, Lesson 9 — Concept 4: Sending non-text inputs

> **Note:** same caveat as this lesson's earlier concepts — the request
> shape below is illustrative, not fetched from a live call. The
> base64-encoding demo, however, is ordinary Python and genuinely runs.

---

## The mechanics behind Lesson 1's conceptual point

[Lesson 1 established that images and documents become tokens too](→ this module, the tokenization lesson, non text inputs also become tokens concept), counting against the same context window and cost as text — but deferred exactly *how* you'd actually include one in a request. That's this concept's job.

---

## `content` becomes an array of typed blocks, not a plain string

Every message so far has had a simple string `content`. Once an image
is involved, `content` becomes an array of distinct, typed blocks
instead — text and image content sitting side by side in the same
message:

```json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "What's in this image?"},
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "iVBORw0KGgoAAAANSUhEUgAA..."}}
  ]
}
```
*(illustrative request shape — not fetched from a live call)*

---

## Why the image data is base64-encoded text, not raw bytes

A JSON request body is plain text — it has no way to embed raw binary
data (an image file's actual bytes) directly. **Base64 encoding**
solves this: it represents binary data as a string of plain ASCII
characters, safe to embed inside JSON text like any other string value.

```python
import base64

fake_image_bytes = b"this represents raw image file bytes"
encoded = base64.b64encode(fake_image_bytes)
print(encoded)
print(encoded.decode("utf-8"))
```
```
b'dGhpcyByZXByZXNlbnRzIHJhdyBpbWFnZSBmaWxlIGJ5dGVz'
dGhpcyByZXByZXNlbnRzIHJhdyBpbWFnZSBmaWxlIGJ5dGVz
```
*(runs live, shows output — read-only demo snippet, not graded)*

`base64.b64encode()` transforms raw bytes into a base64-encoded `bytes`
object; `.decode("utf-8")` converts that into an ordinary Python string
— the actual form that gets placed into the `"data"` field of an image
content block. A real image file, read as bytes and base64-encoded the
same way, is exactly what fills that field in the illustrative request
above — the same operation, just on a much larger, real image file
rather than this toy example's short placeholder text.

---

## Quiz cards

> **Q1.** What changes about a message's `content` field once an image
> is included, compared to a plain text-only message?
> - A) Nothing — `content` stays a plain string either way
> - B) `content` becomes an array of typed content blocks — text and image blocks sitting side by side — rather than a single plain string ✅
> - C) The `role` field is removed entirely
> - D) The message is sent as a completely separate request from the text

> **Q2.** Why can't an image's raw binary data be placed directly inside
> a JSON request body?
> - A) JSON has no length limits, so this isn't actually a problem
> - B) A JSON request body is plain text, with no way to embed raw binary data directly — base64 encoding represents that binary data as safe, embeddable ASCII text instead ✅
> - C) Images are always sent as separate files, never through the API at all
> - D) JSON only supports numbers, never any other data type

> **Q3.** What does `base64.b64encode()` actually do?
> - A) It compresses the image to reduce its file size
> - B) It transforms raw binary data into a text-safe, ASCII-encoded representation that can be embedded inside a JSON string ✅
> - C) It converts an image into a different image format
> - D) It removes the need to send any image data at all

---

*(End of Concept 4. This lesson continues with Concept 5 — streaming a
response — drafted separately.)*
