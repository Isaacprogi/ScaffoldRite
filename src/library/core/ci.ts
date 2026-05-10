export function getWorkflowContent(options?: { ref?: string; onlyAgainst?: boolean, hasAgainst?: boolean }): string {
  if (!options?.hasAgainst || !options.ref) {
    // No ref provided
    return `name: Scaffoldrite Validation

on:
  push:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Scaffoldrite
        run: npm install -g scaffoldrite

      - name: Validate project structure
        run: scaffoldrite validate
`;
  } else if (options.ref && options.onlyAgainst) {
    // Only validate using PR rules with ref
    return `name: Scaffoldrite Validation

on:
  push:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Scaffoldrite
        run: npm install -g scaffoldrite

      - name: Validate using PR rules
        run: npx scaffoldrite validate --against ${options.ref} 
`;
  } else {
    // Validate both project structure and PR rules with ref
    return `name: Scaffoldrite Validation

on:
  push:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Scaffoldrite
        run: npm install -g scaffoldrite

      - name: Validate project structure
        run: scaffoldrite validate

      - name: Validate using PR rules
        run: npx scaffoldrite validate --against ${options.ref}
`;
  }
}