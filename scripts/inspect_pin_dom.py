#!/usr/bin/env python3
import time, json
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    b = pw.chromium.connect_over_cdp("http://localhost:9223")
    ctx = b.contexts[0]
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://www.pinterest.com/pin-builder/", wait_until="domcontentloaded")
    time.sleep(4)
    js = """
    () => {
      const out = [];
      const els = document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]');
      els.forEach(e => {
        out.push({
          tag: e.tagName.toLowerCase(),
          id: e.id || null,
          dtid: e.getAttribute('data-test-id'),
          placeholder: e.getAttribute('placeholder'),
          aria: e.getAttribute('aria-label'),
          role: e.getAttribute('role'),
          maxlen: e.getAttribute('maxlength'),
        });
      });
      return out;
    }
    """
    fields = page.evaluate(js)
    print(json.dumps(fields, ensure_ascii=False, indent=2))
