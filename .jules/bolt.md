## 2026-01-26 - Recursive MutationObserver Stacking
**Learning:** `handleRA` added a new MutationObserver to `hashSection` every time it ran. Since `handleRA` is triggered by the observer itself (or the global body observer), this created a chain of duplicate observers. This causes `handleRA` to run multiple times for a single event, amplifying expensive operations like JSON parsing.
**Action:** Always ensure previous observers are disconnected before attaching a new one, especially in functions that can be re-entered or triggered by the observer itself.
