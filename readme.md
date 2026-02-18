# Scaffoldrite: Define. Enforce. Generate. 🏗️

> *Structure the right way*

**Stop guessing. Start structuring.** Your project's organization should be as reliable as your code. With Scaffoldrite, it will be.

---

![ScaffoldRite Banner](https://raw.githubusercontent.com/isaacprogi/scaffoldrite/main/public/scaffoldrite-banner.png)

---

## 🚨 v2.0.0 – Breaking Change: Config Location

Scaffoldrite v2 introduces a **dedicated config directory**.

### What Changed

**Before (v1.x):**
```
structure.sr
.scaffoldignore
```

**Now (v2.x):**
```
.scaffoldrite/
├─ structure.sr
└─ .scaffoldignore
```

Scaffoldrite no longer reads config files from the project root.

### 🔁 Migration

You have two options:

#### Option 1: Regenerate (Recommended)
```bash
sr init
```

#### Option 2: Migrate Existing Config

```bash
sr init --migrate
```

This will:
- Move `structure.sr` → `.scaffoldrite/structure.sr`
- Move `.scaffoldignore` → `.scaffoldrite/.scaffoldignore`

> ⚠️ If `.scaffoldrite/` already contains these files, use `--force` to overwrite:
```bash
sr init --migrate --force
```

If no legacy config is found, Scaffoldrite will notify you:
```
ℹ No legacy config found to migrate.
```

---

## 🎯 The Problem Every Developer Faces

Remember joining a project and spending days just figuring out where things go? Or watching your team's codebase slowly become a jungle of misplaced files? We've all been there.

**Projects don't fail because of bad code alone—they fail because of bad structure.**

Scaffoldrite solves this by giving you:
- A **single source of truth** for your project layout
- **Enforceable rules** that prevent structural rot
- **One-command generation** of perfect project skeletons
- **Confidence** that your structure stays consistent

---

## 🚀 Your First 60 Seconds with Scaffoldrite

### 1. Install
```bash
npm install -g scaffoldrite
```

### 2. Choose Your Command
```bash
sr            # Short and sweet (recommended for daily use)
scaffoldrite  # Full name (great for scripts)
```
**Both work identically—use whichever fits your workflow.**

### 3. Create Your Blueprint
```bash
sr init
```
> Creates `.scaffoldrite/structure.sr`—your project's architectural blueprint.

### 4. Define Your Structure
Edit `.scaffoldrite/structure.sr`:
```sr
folder src {
  folder components {
    file Button.tsx
    file Header.tsx
  }
  folder utils {
    file helpers.ts
  }
  file index.ts
}

constraints {
  mustContain src index.ts
  maxFiles src/components 10
}
```

### 5. Generate It
```bash
sr generate .
```
Your structure is now reality.

---

## 📖 The structure.sr Language

### Simple. Literal. Powerful.

Your `structure.sr` file describes exactly what should exist. No magic, no wildcards—just clear declarations:

```sr
# This creates exactly what you see
folder src {
  folder pages {
    file index.tsx           # Creates: src/pages/index.tsx
    file about.tsx           # Creates: src/pages/about.tsx
  }
  folder api {
    folder users {           # Creates: src/api/users/
      file GET.ts
      file POST.ts
    }
  }
}
```

**Every name is literal.** `file [...slug].tsx` creates a file literally named `[...slug].tsx`—perfect for Next.js, SvelteKit, or any framework with special file naming conventions.

---

## ⚡ Command Reference

### Positional Arguments

Scaffoldrite uses positional arguments where meaning depends on position. **Flags (options starting with `--` or `-`) are extracted and don't count as positional arguments.**

| Command | Position 1 | Position 2 | Position 3 | Position 4 |
|---------|------------|------------|------------|------------|
| `init` | (command) | — | Directory (with `--from-fs`) | — |
| `update` | (command) | — | Directory to scan (with `--from-fs`) | — |
| `merge` | (command) | — | Directory to merge (with `--from-fs`) | — |
| `list` | (command) | — | — | — |
| `create` | (command) | Path to create | `file` or `folder` | — |
| `delete` | (command) | Path to delete | — | — |
| `rename` | (command) | Old path | New name/path | — |
| `generate` | (command) | Output directory (**required**) | — | — |
| `validate` | (command) | — | — | — |
| `find` | (command) | Search query | — | — |

### Argument Processing

1. **Flags are extracted first** – All `--flag` and `-f` options are removed
2. **Remaining arguments are positional** – Meaning depends on position
3. **Flag values are paired** – Values following flags like `--from-fs ./src` stay with their flag

### Usage Examples

```bash
# init with --from-fs
sr init --from-fs ./src
#            arg3: ./src

# generate with output directory (required)
sr generate .
#           arg2: .

sr generate ./output
#           arg2: ./output

# create with flags
sr create src/components/ui button.ts file --force --verbose
#           arg2: src/components/ui  arg3: button.ts  arg4: file

# rename with confirmation skip
sr rename src/oldfile.txt newfile.txt --yes
#           arg2: src/oldfile.txt  arg3: newfile.txt

# find a file or folder
sr find Button
#           arg2: Button

# generate with dry-run
sr generate ./dist --dry-run
#           arg2: ./dist

# generate with copy flag
sr generate ./template --copy --summary
#           arg2: ./template
```

### Best Practices
- **Place flags after positional arguments** for clarity
- **Flag order doesn't matter** – `sr create path file --force --verbose` equals `sr create path file --verbose --force`
- **Flag values stay paired** – `--from-fs ./src` is treated as one unit

**Important:** For `generate`, the output directory is **required**. Use `.` for current directory or specify a path.

---

## 🛠️ Command Flags Reference

### `init` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Overwrite existing config files | `sr init --force` |
| `--empty` | Create minimal structure with only constraints block | `sr init --empty` |
| `--from-fs <directory>` | Generate from existing filesystem | `sr init --from-fs ./src` or `sr init --from-fs .` |
| `--migrate` | Move legacy v1.x config to `.scaffoldrite/` | `sr init --migrate` |

### `update` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--from-fs <directory>` | Update from filesystem (required) | `sr update --from-fs .` |
| `--yes` / `-y` | Skip confirmation prompts | `sr update --from-fs . --yes` |

### `merge` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--from-fs <directory>` | Merge from filesystem (required) | `sr merge --from-fs ./features` |
| `--yes` / `-y` | Skip confirmation prompts | `sr merge --from-fs . --yes` |

### `generate` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr generate . --yes` |
| `--dry-run` | Preview changes without applying | `sr generate . --dry-run` |
| `--verbose` | Show detailed output | `sr generate . --verbose` |
| `--summary` | Display operations as they happen | `sr generate . --summary` |
| `--ignore-tooling` | Generate without scaffold config | `sr generate . --ignore-tooling` |
| `--copy` | Copy file contents from source to output | `sr generate ./output --copy` |

### `validate` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--allow-extra` | Allow extra files not in structure | `sr validate --allow-extra` |
| `--allow-extra <paths...>` | Allow specific extra files | `sr validate --allow-extra README.md .env` |

### `create` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Overwrite existing item | `sr create src/index.ts file --force` |
| `--if-not-exists` | Skip if path already exists | `sr create src/utils folder --if-not-exists` |
| `--yes` | Skip confirmation prompts | `sr create src/hooks folder --yes` |
| `--dry-run` | Preview changes | `sr create src/components folder --dry-run` |
| `--verbose` | Show detailed output | `sr create src/utils.ts file --verbose` |
| `--summary` | Display operations | `sr create src/lib folder --summary` |

### `delete` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr delete src/old --yes` |
| `--dry-run` | Preview changes | `sr delete src/temp --dry-run` |
| `--verbose` | Show detailed output | `sr delete src/deprecated --verbose` |
| `--summary` | Display operations | `sr delete src/legacy --summary` |

### `rename` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr rename src/index.ts main.ts --yes` |
| `--dry-run` | Preview changes | `sr rename src/utils helpers --dry-run` |
| `--verbose` | Show detailed output | `sr rename src/lib library --verbose` |
| `--summary` | Display operations | `sr rename src/components ui --summary` |

### `list` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--structure` / `--sr` | Show `structure.sr` contents (respects ignore list) | `sr list --structure` |
| `--fs` | Show filesystem structure (respects ignore list) | `sr list --fs` |
| `--diff` | Compare `structure.sr` vs filesystem | `sr list --diff` |
| `--with-icon` | Print with icons | `sr list --sr --with-icon` |

### `find` Command
| Flag | Description | Example |
|------|-------------|---------|
| `--structure` / `--sr` | Search only in structure.sr | `sr find Button --sr` |
| `--fs` | Search only in filesystem | `sr find Button --fs` |
| *(default)* | Search both structure and filesystem | `sr find Button` |

---

## 🗂️ Daily Workflows

### Initialize & Setup

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr init` | Creates starter `structure.sr` | Starting any new project |
| `sr init --empty` | Creates minimal structure with only constraints | When you want complete control |
| `sr init --from-fs <directory>` | Generates from existing project | Adopting Scaffoldrite in existing codebase |
| `sr update --from-fs <directory>` | Updates existing `structure.sr` from filesystem | Syncing structure with manual changes |
| `sr merge --from-fs <directory>` | Merges folder structure into current `structure.sr` | Combining multiple project layouts |
| `sr init --force` | Overwrites existing config | Starting fresh |

**Important:** For `generate`, `update --from-fs`, `merge --from-fs`, and `init --from-fs`, you **must provide a directory path** or `.` for current directory.

```bash
# Generate to current directory
sr generate .

# Generate to specific directory
sr generate ./output

# Init from current directory
sr init --from-fs .

# Update from specific directory
sr update --from-fs ./components
```

### Validate & Check

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr validate` | Checks if filesystem matches structure.sr | Before commits, in CI/CD |
| `sr validate --allow-extra` | Allows extra files not in structure | During migration phases |
| `sr validate --allow-extra README.md` | Allows specific extra files | When some files are intentionally outside structure |

```bash
# Strict check (CI/CD ready)
sr validate

# Migration phase - be gentle
sr validate --allow-extra

# Only these can be extra
sr validate --allow-extra README.md .env.example
```

### Generate & Create

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr generate <directory>` | Creates entire structure (must provide directory or `.`) | Initial setup, resetting structure |
| `sr generate ./output` | Generates to specific directory | Creating templates for others |
| `sr generate . --yes` | Skips confirmation prompts | Automation scripts |
| `sr generate . --dry-run` | Previews what would happen | Review before applying |
| `sr generate ./output --copy` | Copies structure with file contents | Creating complete project templates |

```bash
# Create structure in current directory (empty files)
sr generate .

# Copy structure AND file contents to output directory
sr generate ./project-template --copy

# Preview what would be copied
sr generate ./dist --copy --dry-run
```

### Modify & Evolve

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr create <path> folder` | Adds folder to structure | Adding new feature areas |
| `sr create <path> file` | Adds file to structure | Creating new modules |
| `sr delete <path>` | Removes from structure | Cleaning up tech debt |
| `sr rename <old> <new>` | Renames in structure | Refactoring |
| `sr update --from-fs .` | Syncs structure.sr from current files | After manual tweaks |
| `sr merge --from-fs ./new-features` | Merges new files into structure.sr | Collaborative feature adds |

```bash
# Add a utils folder
sr create src/utils folder

# Rename it to helpers
sr rename src/utils src/helpers

# Add a core utility file
sr create src/helpers/format.ts file

# Remove it
sr delete src/helpers/format.ts
```

### Inspect & Understand

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr list` | Shows all structure.sr contents (ignores ignore list) | Quick reference |
| `sr list --structure` | Shows structure.sr respecting ignore list | Quick reference |
| `sr list --fs` | Shows actual filesystem (respects ignore list) | Seeing current state |
| `sr list --diff` | Compares structure.sr vs filesystem | Finding discrepancies |
| `sr find <query>` | Searches for files/folders in structure and filesystem | Locating specific items |
| `sr version` | Shows Scaffoldrite version | Debugging, reporting issues |

```bash
# What's supposed to be here?
sr list

# What's actually here?
sr list --fs

# What's different?
sr list --diff

# Find Button component
sr find Button

# Search only in structure.sr
sr find Button --sr

# Search only in filesystem
sr find Button --fs
```

---

## 🛡️ Constraints: Your Structure's Rules Engine

Constraints are where Scaffoldrite becomes powerful. They're rules that must always be true about your structure.

### Basic Constraints (Apply to specific paths)

| Constraint | What It Means | Real-World Use |
|------------|--------------|----------------|
| `require src` | `src/` must exist | Ensuring core directories exist |
| `forbid temp/` | `temp/` must NOT exist | Preventing temporary clutter |
| `mustContain src index.ts` | `src/` must contain `index.ts` | Entry point validation |
| `mustHaveFile src/components Button.tsx` | Must have exact file | Critical component checks |
| `maxFiles src/components 10` | No more than 10 files | Preventing component bloat |
| `maxDepth src 4` | Maximum 4 nested folders | Controlling complexity |
| `fileNameRegex src/ ^[a-z-]+\.tsx$` | Files must match pattern | Enforcing naming conventions |

```sr
constraints {
  require src
  forbid .temp
  mustContain src index.ts
  maxFiles src/components 15
  fileNameRegex src/components/ ^[A-Z][a-zA-Z]+\.tsx$
}
```

### "Each Folder" Constraints (The * and ** Magic)

Apply rules to multiple folders at once:

| Scope | Meaning | Example |
|-------|---------|---------|
| `*` | **Every direct child folder** (non-recursive) | `src/*` = `src/a/`, `src/b/` (not `src/a/nested/`) |
| `**` | **All nested folders** (recursive) | `src/**` = `src/a/`, `src/a/nested/`, `src/b/`, etc. |

#### Available Each-Folder Constraints:

| Constraint | What It Means |
|------------|--------------|
| `eachFolderMustContain * src index.ts` | Every folder in `src/` must contain `index.ts` |
| `eachFolderMustContainFile ** src README.md` | Every folder (recursive) must have `README.md` |
| `eachFolderMustContainFolder * src tests` | Every folder must contain `tests/` subfolder |
| `eachFolderMustHaveExt ** src .ts` | Every folder must have at least one `.ts` file |

**Example Scenarios:**

1. **Monorepo Package Consistency:**
   ```sr
   constraints {
     eachFolderMustContainFile * packages package.json
     eachFolderMustContain ** packages/src index.ts
   }
   ```

2. **Next.js API Route Standards:**
   ```sr
   constraints {
     eachFolderMustContainFile ** src/pages _app.tsx
     fileNameRegex src/api/* ^(GET|POST|PUT|DELETE|PATCH)\.ts$
   }
   ```

3. **React Component Organization:**
   ```sr
   constraints {
     eachFolderMustContain * src/features index.ts
     maxDepth src/features 3
   }
   ```

### Complete Constraint Reference

| Constraint | Arguments | Example |
|------------|-----------|---------|
| `require` | `<path>` | `require src` |
| `forbid` | `<path>` | `forbid .temp` |
| `mustContain` | `<path> <value>` | `mustContain src index.ts` |
| `mustHaveFile` | `<path> <fileName>` | `mustHaveFile src/components Button.tsx` |
| `fileNameRegex` | `<path> <regex>` | `fileNameRegex src/ ^[a-z-]+\.tsx$` |
| `maxFiles` | `<path> <number>` | `maxFiles src/components 10` |
| `maxFolders` | `<path> <number>` | `maxFolders src 5` |
| `minFiles` | `<path> <number>` | `minFiles src 1` |
| `minFolders` | `<path> <number>` | `minFolders src 2` |
| `maxDepth` | `<path> <number>` | `maxDepth src 4` |
| `maxFilesRecursive` | `<path> <number>` | `maxFilesRecursive src 100` |
| `maxFoldersRecursive` | `<path> <number>` | `maxFoldersRecursive src 50` |
| `maxFilesByExt` | `<path> <ext> <number>` | `maxFilesByExt src .ts 10` |
| `maxFilesByExtRecursive` | `<path> <ext> <number>` | `maxFilesByExtRecursive src .ts 50` |
| `eachFolderMustContain` | `<scope> <path> <value>` | `eachFolderMustContain ** src index.ts` |
| `eachFolderMustContainFile` | `<scope> <path> <fileName>` | `eachFolderMustContainFile * src README.md` |
| `eachFolderMustContainFolder` | `<scope> <path> <folderName>` | `eachFolderMustContainFolder * src tests` |
| `eachFolderMustHaveExt` | `<scope> <path> <ext>` | `eachFolderMustHaveExt ** src .ts` |

---

## 🚫 Ignoring Files: The .scaffoldignore

Sometimes you need exceptions. That's where `.scaffoldrite/.scaffoldignore` comes in:

```ignore
# .scaffoldignore - works like .gitignore
node_modules/      # Ignore dependencies
dist/             # Ignore build output
.temp/            # Ignore temporary files
```

**Used when:**
- `sr init --from-fs` (snapshots ignore these)
- `sr validate` (validation ignores these)
- `sr list --fs` (listing ignores these)
- `sr generate` (generation ignores these)

---

## 📋 Project Configuration: project.json

When you run `sr init`, Scaffoldrite creates `.scaffoldrite/project.json` to store project metadata:

```json
{
  "framework": "",
  "language": "",
  "version": "1.0.0",
  "author": "",
  "conventions": {
    "description": "",
    "folderStructure": [],
    "namingRules": [],
    "folderDepthLimits": [],
    "userNotes": []
  },
  "additionalInfo": {
    "stateManagement": "",
    "styling": "",
    "testing": "",
    "routing": "",
    "apiClient": ""
  }
}
```

This file helps document your project's architectural decisions and conventions for your team.

---

## ⚠️ Filesystem Changes & Content Handling

### Drift Detection
Manually deleted files or folders are considered **filesystem drift**. Changes made outside Scaffoldrite (e.g., via `rm`, file explorers, or other scripts) are **not tracked**. Scaffoldrite does **not record history** of such changes.

### Regeneration Behavior
`sr generate` **enforces the expected structure**, but does **not preserve or restore file contents** (unless using `--copy` flag). When it recreates a manually deleted file:
- The file will be **empty**, or
- Created from a **template** if one is defined, or
- **Copied from source** if using `--copy` flag and file exists in source

### Copy Flag Behavior
`sr generate --copy` **copies file contents** from source to output directory. This is useful for:
- Creating project templates with actual file content
- Generating complete project structures from existing codebases
- Preserving file contents when generating to output directories

**Note:** The `--copy` flag only works when generating to a different output directory, not when regenerating in-place.

### No Content Backup
Scaffoldrite tracks **structural intent only** — it does **not back up file contents**. Use **Git** or another version control system to recover lost content.

> **"Scaffoldrite deleted my file content 😡"**
> This usually happens when files were removed manually outside Scaffoldrite and then regenerated. Scaffoldrite does **not** delete or overwrite file contents arbitrarily — it only restores the **expected structure**. Always use Git or another VCS to protect and recover file contents.

---

## 💾 Preserving Content & Mitigating Risks

Scaffoldrite focuses on **structure, not file content**. By default, `sr generate` creates missing files or folders **without preserving existing file content**. To make this safer:

### 1️⃣ Use `--copy` when generating to a different directory
```bash
sr generate ./output --copy
```
- Copies existing file contents from source to output
- Maintains templates or boilerplate if defined
- Great for creating project templates or starter kits

**Notes:**
- `--copy` **does not work in-place**; use Git or manual backup for regenerating in the same directory
- Cannot be combined with `--ignore-tooling`

### 2️⃣ Commit changes before regenerating
Always commit your work before running `sr generate`:
```bash
git add .
git commit -m "Save work before sr generate"
```
This ensures you can **restore deleted or modified files** if anything goes wrong.

### 3️⃣ Validate first
Preview what Scaffoldrite would change without affecting your files:
```bash
sr validate --allow-extra
```
This shows missing, extra, or misaligned files.

### 4️⃣ Rename carefully
Instead of renaming in `structure.sr` first:
1. Rename the file in your filesystem
2. Sync your `structure.sr`:
```bash
sr update --from-fs .
```
This preserves content because the filesystem rename happens before Scaffoldrite updates the structure.

### ⚠️ Warning
> Renaming a file in `structure.sr` **will delete the old file in the filesystem**. Commit or back up your work first.

---

## 🎯 Real-World Workflows

### The Startup: Rapid Prototyping
```bash
# Day 1: Vision
sr init --empty
# Edit structure.sr with your dream structure
sr generate .

# Day 7: Add constraints as patterns emerge
# Add to constraints block:
# eachFolderMustContain * src/features index.ts
# fileNameRegex src/components/ ^[A-Z][a-zA-Z]+\.tsx$

# Day 30: Scale with confidence
sr validate  # CI/CD passes every time
```

### The Enterprise: Governance & Standards
```bash
# Template team creates golden structure
sr init --from-fs ./golden-template
# Add strict constraints
# Save to company template repo

# Development teams:
sr init --from-fs company-templates/react-starter
sr generate .
sr validate  # Ensures compliance
```

### The Open Source Maintainer: Contributor Onboarding
```sr
constraints {
  eachFolderMustContainFile * examples README.md
  eachFolderMustContain ** src tests
  maxFiles src/lib 20
}
```
"Every example has docs, every module has tests, and the core library stays lean."

### The Freelancer: Client Consistency
```bash
# Your personal template
sr init --from-fs ./best-client-project

# New client? Perfection in seconds:
sr generate ./client-project --copy
# Every client gets your proven structure AND code
```

### The Template Creator: Complete Project Templates
```bash
# Create a template from your best project
sr init --from-fs ./best-project

# Generate complete templates with all file content
sr generate ./project-template --copy

# Share the template with your team
# They get structure AND content!

# Alternative: Create clean starter kits
sr generate ./starter-kit --copy --ignore-tooling
# Creates a clean starter kit without .scaffoldrite config
```

---

## 🔧 Advanced Scenarios

### Handling Dynamic-Looking Names
```sr
# These create LITERAL names - perfect for framework conventions
folder src {
  folder pages {
    file [id].tsx        # Creates: src/pages/[id].tsx
    file [...slug].tsx   # Creates: src/pages/[...slug].tsx
    file (auth).tsx      # Creates: src/pages/(auth).tsx
  }
}

constraints {
  # Ensure every route group has layout
  eachFolderMustContainFile * src/pages layout.tsx
}
```

### Progressive Constraint Adoption
```bash
# Phase 1: Document only
sr validate --allow-extra

# Phase 2: Allow known exceptions
sr validate --allow-extra README.md .env

# Phase 3: Strict compliance
sr validate  # CI/CD fails on violations
```

### Structure Migration
```bash
# Capture current state
sr init --from-fs . --force

# Clean up in structure.sr
# Remove old folders, rename files

# Apply new structure
sr generate . --yes

# Validate no regressions
sr validate --allow-extra  # Temporary allowance
```

---

## ❓ FAQ

### "What if I edit filesystem manually?"
Run `sr validate` to check. Use `sr update --from-fs .` to accept changes, or `sr generate .` to revert to structure.

### "Can I have multiple structure files?"
Not directly, but generate to different directories:
```bash
sr generate ./project-a
sr generate ./project-b
```

### "Is this like a linter for file structure?"
Exactly! It's ESLint/Prettier for your project's organization.

### "What about heavy dev files like node_modules?"
Add them to `.scaffoldignore` or use `--allow-extra` during validation.

### "How do I preserve file content when generating templates?"
Use the `--copy` flag when generating to an output directory:
```bash
sr generate ./template --copy
```

### "Can I use --copy and --ignore-tooling together?"
No, these flags are mutually exclusive. Choose:
- `--copy` to preserve file contents
- `--ignore-tooling` to generate without .scaffoldrite config

### "Does --copy work when generating in the same directory?"
No, `--copy` only works when generating to a different output directory.

### "Why do I need to provide a directory for generate?"
For clarity and safety, `sr generate` requires you to explicitly specify where to generate:
- Use `.` for current directory
- Use `./output` for a specific directory
This prevents accidental overwrites.

### "How do I search for specific files or folders?"
Use the `find` command:
```bash
sr find Button          # Search for "Button" in both structure and filesystem
sr find Button --sr     # Search only in structure.sr
sr find Button --fs     # Search only in filesystem
```

---

## 🤝 Join the Community

**Scaffoldrite** is built by developers for developers. Whether you're:
- A **solo founder** keeping projects maintainable
- A **team lead** enforcing standards without micromanaging
- An **open source maintainer** guiding contributors
- A **freelancer** delivering consistent quality

You're in the right place.

**[⭐ Star on GitHub](https://github.com/Isaacprogi/scaffoldrite)** · 
**[🐛 Report Issues](https://github.com/Isaacprogi/scaffoldrite/issues)** · 
**[💬 Share Ideas](https://github.com/Isaacprogi/scaffoldrite/discussions)**

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Your project's structure is code too. Treat it with the same care.**

*Happy structuring! 🏗️*
