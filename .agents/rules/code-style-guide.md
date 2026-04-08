---
trigger: always_on
---

1. I want files in the `src/sdk` directory to contain English comments **only** in `types.ts` and `types.**.ts` files; no comments should appear elsewhere. However, all exported variables in `utils.ts` or within the `utils` directory must also have comments. If an exported variable is of a complex type, then its public properties and methods must also be documented. If a folder contains an `index.ts` file, then all exports in that file—including re-exports—must be documented. Additionally, if a class contains `protected` members, those that meet the above rules must also be documented.

2. If I ask you to generate code, you must review it after generation to ensure it meets the requirements, rather than submitting it directly without verifying its correctness.
