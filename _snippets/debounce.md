---
title: "Tiny debounce (vanilla JS)"
date: 2025-04-20
category: snippet
tags: [javascript]
lang: javascript
excerpt: "A 6-line debounce with no dependencies."
preview: |
  const debounce = (fn, ms = 200) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
---
```js
const debounce = (fn, ms = 200) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};
```

## The whole thing, with the edge cases

The six lines above are the idea. This is what it looks like once you have
handled `this`, a leading call and cancellation — longer, and not the part
worth reading first.

{% include components/code.html title="debounce.js — the complete version" lang="javascript" code="export function debounce(fn, ms = 200, { leading = false } = {}) {
  let t = null;
  let calledLeading = false;

  function debounced(...args) {
    if (leading && !calledLeading) {
      calledLeading = true;
      fn.apply(this, args);
    }
    clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      calledLeading = false;
      if (!leading) fn.apply(this, args);
    }, ms);
  }

  debounced.cancel = () => {
    clearTimeout(t);
    t = null;
    calledLeading = false;
  };

  return debounced;
}" %}
