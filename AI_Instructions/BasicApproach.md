# Basic Approach — AI Instructions

These instructions define the required workflow and coding preferences when working on this repository.

## 1. GitHub / Merge Request Workflow

* **Never create a Merge Request (MR) unless the user explicitly asks for one.**
* The normal workflow is:

  1. Discuss the requirement, approach, and proposed changes in the chat.
  2. After the approach is agreed, update the **local repository**.
  3. Verify that the implementation is working correctly.
  4. Only after the repository is in a proper working condition should changes be pushed to GitHub.
* Do not push incomplete, unverified, or merely experimental changes to GitHub.
* Do not independently decide to create an MR, branch for review, or initiate a GitHub review workflow unless explicitly requested.

## 2. Import Formatting

* Keep each import statement on **one line**.
* Do not split a single import across multiple lines.

Example:

```ts
import { foo, bar, baz } from './utils';
```

Not:

```ts
import {
    foo,
    bar,
    baz
} from './utils';
```

## 3. No Generated Files / Documents in the Chat

* Do **not** create or attach separate files, documents, reports, or similar artifacts for code discussions.
* Code should be studied, explained, reviewed, and discussed **directly in the chat**.
* When discussing implementation, prefer relevant code snippets in the conversation rather than generating documentation files.

## 4. Internal Review Before Responding

* Perform an **internal review of the proposed answer, explanation, architecture, or code before responding**.
* The response should present the reviewed recommendation rather than a sequence of competing revisions.
* Do **not** provide multiple similar implementations in the same response and then revise one of them afterward.
* Avoid responses structured like:

  * initial solution/code
  * "we can do this better"
  * second solution/code
  * another revision
* Before providing code, determine whether the requirement or approach is sufficiently clear.
* If clarification or discussion of the approach is necessary, **discuss/resolve the approach first and provide the code afterward**.
* When there are multiple valid approaches, explain the relevant trade-offs and recommend the appropriate approach rather than presenting several near-duplicate code versions.

## 5. Repository Instructions Must Be Refreshed

* The repository contains an `AI_Instructions` folder.
* `AI_Instructions/BasicApproach.md` is the authoritative source for these workflow instructions.
* **Whenever accessing the GitHub repository, read or refresh `AI_Instructions/BasicApproach.md` before performing repository-related work.**
* Do not rely solely on previously remembered instructions when the repository can be accessed; use the current file as the source of truth.
* If the current repository instructions conflict with older assumptions or previous conversation context, follow the current `BasicApproach.md`.

## 6. General Working Principle

* Prioritize **discussion → agreed approach → local implementation → verification → GitHub push**.
* Do not skip directly from a requirement to a GitHub change when the requirement or approach has not been discussed.
* Preserve the existing project architecture and current implementation unless a change has been explicitly agreed upon.
* Distinguish clearly between:

  * what is currently implemented,
  * what is being proposed,
  * and what is only a future possibility.
