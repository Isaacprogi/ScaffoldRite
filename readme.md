# Scaffoldrite

Scaffoldrite is a **project structure validator & generator**.

You define your project structure using a simple `structure.txt` format, then run commands to validate, generate, or modify the structure.

---

## Who should use it?

### ✅ Framework / Library creators
To enforce strict project structure for generated projects.

### ✅ Monorepo maintainers
To enforce consistent folder rules across multiple packages.

### ✅ Teams & Bootcamps
To enforce a standard architecture and reduce mistakes.

### ✅ Project generators
To validate output before publishing.

---

## Features

- Define folder + file structure using `structure.txt`
- Validate structure against rules (constraints)
- Generate filesystem output
- Create / delete / rename files & folders
- Enforce rules like:
  - required files
  - max files per folder
  - regex filename checks
  - unique filenames
  - folder depth limit
  - and more

---

## Example

```txt
folder src {
file index.ts
folder components {
file Button.tsx
}
}

constraints {
require src/index.ts
maxFiles 2 src
fileNameRegex src "^[a-z0-9]+\.ts$"
}
```

## CLI Commands

scaffoldrite validate
scaffoldrite generate
scaffoldrite list
scaffoldrite create <path> <file|folder>
scaffoldrite delete <path>
scaffoldrite rename <path> <newName>