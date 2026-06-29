---
name: new-label-convention
description: Mark every newly added UI element with a "New" badge in this prototype
metadata:
  type: feedback
---

This project (EPAL ERP UI, esp. [[project-erpsystemui-overview]]) is a **UI design / prototype only** — the goal is to mock up screens, demonstrate ideas, and add new features visually. Real backend coding happens later, separately.

When adding anything new to the UI (a feature, module, button, column, widget, nav item), attach a small **"New"** label/badge next to it so the user can instantly see what was there before vs. what was newly added.

**Why:** The user reviews the prototype to decide what to keep; they need to visually distinguish original vs. added elements.

**How to apply:** Add a tiny pill/badge (e.g. a `.badge-new` styled span saying "New") beside the new element. Keep it visually consistent with the existing pill styles in the file.
