# LLM Guideline: Documenting Code Flows

## Introduction

This guideline outlines a systematic process for Large Language Models (LLMs) to document code execution flows within a codebase. The goal is to produce clear, accurate, and maintainable documentation that aids developer understanding, debugging, and onboarding.

## Inputs

The LLM requires the following inputs to initiate the documentation task:

1.  **`entry_point`** (string):
    *   **Definition:** The specific location in the code where the flow begins. This is typically a function, method, or event handler name, along with its file path.
    *   **Example:** `handlePayment(details)` in `src/modules/paymentProcessor.js`

2.  **`additional_context`** (string, optional):
    *   **Definition:** Any constraints, focus areas, or related information needed to scope the documentation accurately. This helps avoid documenting irrelevant paths or details.
    *   **Example:** "Focus only on the successful payment path. Ignore specific error codes 401 and 503. Note interactions with the external `Stripe` API."

3.  **`output_file`** (string):
    *   **Definition:** The target file path where the generated markdown documentation should be saved.
    *   **Example:** `docs/flows/payment_success_flow.md`

## Output

The process generates a markdown file specified by `output_file`. This file should contain:

*   A clear **Title** reflecting the documented flow.
*   A brief **Overview** describing the purpose or context of the flow.
*   One or more **Mermaid Sequence Diagrams** visually representing the interactions between components.
*   A **Detailed Step-by-Step Description** narrating the flow, explaining logic, state changes, and linking directly to relevant lines in the source code using relative markdown links.

## Process Steps (for LLM)

Follow these steps to generate the flow documentation:

1.  **Understand Goal:** Read and confirm understanding of the `entry_point`, `output_file`, and any `additional_context` provided. Ask clarifying questions if the scope is unclear.

2.  **Initial Scan:** Read the code beginning at the specified `entry_point` function/method.

3.  **Trace Calls:**
    *   Identify all direct function/method calls made from the `entry_point`.
    *   Recursively trace relevant *internal* calls within the project codebase. Use file reading and code search tools as necessary.
    *   Identify and clearly mark calls to *external* components (e.g., third-party libraries, web APIs, DOM manipulations, database interactions).
    *   Continuously check against `additional_context` to stay within the requested scope. If the flow diverges unexpectedly or requires exploring paths outside the context, pause and ask the user for clarification.

4.  **Identify Control Flow:** Note significant control flow structures within the traced path(s), such as:
    *   Conditional branches (`if`/`else if`/`else`, `switch`)
    *   Loops (`for`, `while`, `forEach`)
    *   Error handling (`try`/`catch`/`finally`)
    *   Asynchronous operations (`async`/`await`, Promises, callbacks)
    Determine the conditions that lead down the documented path(s).

5.  **Map State Changes:** Identify key variables, object properties, or application states that are modified during the flow. Understanding state changes is crucial for explaining the flow's impact.

6.  **Structure Document:** Create the `output_file`. Add the main title and a brief overview paragraph describing the flow's purpose.

7.  **Create Sequence Diagram(s):**
    *   Use Mermaid syntax, specifically `sequenceDiagram`.
    *   Define participants accurately (e.g., User, specific JS files, external services like 'Stripe API', 'DOM'). Use aliases for brevity.
    *   Map the sequence of calls identified in Step 3. Use arrows (`->>`, `->>+`, `-->>-`, etc.) to show calls and returns.
    *   Add notes (`Note right of/left of/over`) to explain important steps or context directly on the diagram.
    *   Place the diagram(s) logically within the document, usually before the detailed description.
    *   External components should be clearly marked with some annotation or color to demarcate them from internal code.

8.  **Write Detailed Description:**
    *   Provide a narrative walkthrough of the flow, following the sequence diagram(s).
    *   For each significant step:
        *   Explain *what* the code is doing and *why* (its purpose in the flow).
        *   Link to the specific function call or code block using relative markdown links (e.g., [`myFunction`](../../src/utils/helpers.js#L42)).
        *   Mention relevant state changes identified in Step 5.
        *   Explain how control flow decisions (Step 4) direct the execution path being documented.

9.  **Review & Refine:** Before finalizing, review the generated document for:
    *   **Accuracy:** Does the description match the code and diagram?
    *   **Clarity:** Is the language clear and easy to understand?
    *   **Completeness:** Does it cover the scope defined by the inputs?
    *   **Link Validity:** Do all source code links point to the correct locations?

## Conclusion

Following this process helps ensure that generated flow documentation is accurate, useful, and consistent. Remember that code evolves, so these documents may need periodic updates to remain relevant. 