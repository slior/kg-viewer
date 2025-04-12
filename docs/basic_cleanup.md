# Basic Code Cleanup Guideline

## Comments

- Remove commented out code.
- Comment all used functions/methods
    - A short (1-2 sentences) description of the function
    - For each input parameter: name, type, purpose and valid values.
    - Return value and type.
    - Any thrown errors
    - Any assumptions the function makes.
- Do not repeat in comments what is already evident in the code. Inline comments should be for explaining *why* the code is written this way. Not repeat the code statements.

## Literals
- Literals should be defined as constants.
    - Exception: literals used only once in the same scope they are defined.
    - Exception: log messages.
- Replace literals (string, numbers, etc) with properly named constants.

## Duplication
- Avoid code duplication of repeating code snippets. If a code snippet is similar to another snippet in nearby code - extract to a function and parameterize properly.

## Clean Functions
- Functions should be properly named and documented.
- Functions should be small, 5-10 statements at most.
- Break bigger functions by extracting code in nested blocks (e.g. conditionals, loops) into helper functions.
- Try to maintain a consistent level of abstraction in the same function.