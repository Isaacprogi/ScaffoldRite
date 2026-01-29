# Scaffoldrite: Define. Enforce. Generate. 🏗️

**Stop guessing. Start structuring.** Your project's organization should be as reliable as your code. With Scaffoldrite, it will be.

---

# ⚠️ Filesystem Changes & Recovery Policy

## Drift Detection
Manually deleted files or folders are treated as **filesystem drift**.  
Changes made **outside Scaffoldrite** (using `rm`, file explorers, or other scripts) are **not recorded** in history.

## Regeneration Behavior
`scaffoldrite generate` **restores structure, not file contents**.  
When it recreates a manually deleted file:
- The file will be **empty**, OR
- Created from a **template** if one is defined

## No Content Backup
**File contents are never backed up by Scaffoldrite**.  
Scaffoldrite tracks **structural intent only**. Use **Git** or another version control system to recover lost file contents.

## Recoverable Operations
**Exception** — Scaffoldrite-managed operations **are** recoverable.  
Files or folders modified using Scaffoldrite commands (`create`, `delete`, `rename`, `merge`, or `generate` when history is enabled) are recorded as **operation-level history** and can be inspected or recovered from `.scaffoldrite/history`.

> **“Scaffoldrite deleted my files 😡”**
>
> This usually means files were deleted **manually outside Scaffoldrite** and later recreated by `scaffoldrite generate`.
> Scaffoldrite did **not** delete file contents — it only restored the expected structure.
> File contents are not tracked or backed up and must be recovered using Git or another version control system.


## 🎯 The Problem Every Developer Faces

Remember that time you joined a project and spent days just figuring out where things go? Or when your team's codebase slowly became a jungle of misplaced files? We've all been there.

**Projects don't fail because of bad code alone—they fail because of bad structure.**

Scaffoldrite solves this by giving you:
- A **single source of truth** for your project layout
- **Enforceable rules** that prevent structural rot
- **One-command generation** of perfect project skeletons
- **Confidence** that your structure stays consistent

---

## 🚀 Your First 60 Seconds with Scaffoldrite

### 1. Install It
```bash
npm install -g scaffoldrite
```

### 2. Choose Your Command
```bash
sr            # Short and sweet (recommended daily use)
scaffoldrite  # Full name (great for scripts)
```
**Both do the same thing—use whichever you prefer!**

### 3. Create Your Blueprint
```bash
sr init
```
This creates `structure.sr`—your project's architectural blueprint.

### 4. Define Your Vision
Edit `structure.sr`:
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

### 5. Make It Real
```bash
sr generate
```
Boom! Your perfect structure is now reality.

---

## 📖 The structure.sr Language

### Simple. Literal. Powerful.

Your `structure.sr` file describes exactly what should exist. No magic, no wildcards—just clear declaration:

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

**Every name is literal.** `file [...slug].tsx` creates a file literally named `[...slug].tsx`. Perfect for Next.js, SvelteKit, or any framework with special file names.

---

## ⚡ Command Line Interface

### Positional Arguments Reference

Scaffoldrite uses positional arguments where the meaning depends on their position:

| Command    | arg3 stands for               | arg4 stands for |
| --------   | ---------------------------   | --------------- | 
| `init`     | dir when `--from-fs`          | —               | 
| `update`   | dir to scan                   | —               | 
| `merge`    | dir to merge                  | —               | 
| `list`     | dir to list                   | —               |
| `create`   | path to create                | file/folder     |
| `delete`   | path to delete                |                 |
| `rename`   | old path                      | new name        |
| `generate` | outputDir                     | —               |
| `validate` | outputDir (after filtering)   | —               | 

### Flags Reference

Each command supports specific flags:

#### `init` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Overwrite existing `structure.sr` | `sr init --force` |
| `--empty` | Create minimal structure with only constraints block | `sr init --empty` |
| `--from-fs` | Generate from existing filesystem | `sr init --from-fs ./src` |

#### `update` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--from-fs` | Update from filesystem (required) | `sr update --from-fs .` |
| `--yes` / `-y` | Skip confirmation prompts | `sr update --from-fs . --yes` |

#### `merge` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--from-fs` | Merge from filesystem (required) | `sr merge --from-fs ./features` |
| `--yes` / `-y` | Skip confirmation prompts | `sr merge --from-fs . --yes` |

#### `validate` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--allow-extra` | Allow extra files not in structure | `sr validate --allow-extra` |
| `--allow-extra <paths...>` | Allow specific extra files | `sr validate --allow-extra README.md .env` |

#### `generate` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr generate --yes` |
| `--dry-run` | Show what would happen without making changes | `sr generate --dry-run` |
| `--verbose` | Show detailed output | `sr generate --verbose` |
| `--show` | Display operations as they happen | `sr generate --show` |

#### `create` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Overwrite existing item | `sr create src/index.ts file --force` |
| `--if-not-exists` | Skip if path already exists | `sr create src/utils folder --if-not-exists` |
| `--yes` | Skip confirmation prompts | `sr create src/hooks folder --yes` |
| `--dry-run` | Show what would happen | `sr create src/components folder --dry-run` |
| `--verbose` | Show detailed output | `sr create src/utils.ts file --verbose` |
| `--show` | Display operations as they happen | `sr create src/lib folder --show` |

#### `delete` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr delete src/old --yes` |
| `--dry-run` | Show what would happen | `sr delete src/temp --dry-run` |
| `--verbose` | Show detailed output | `sr delete src/deprecated --verbose` |
| `--show` | Display operations as they happen | `sr delete src/legacy --show` |

#### `rename` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--yes` | Skip confirmation prompts | `sr rename src/index.ts main.ts --yes` |
| `--dry-run` | Show what would happen | `sr rename src/utils helpers --dry-run` |
| `--verbose` | Show detailed output | `sr rename src/lib library --verbose` |
| `--show` | Display operations as they happen | `sr rename src/components ui --show` |

#### `list` Command Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--structure` / `--sr` | Show structure.sr contents | `sr list --structure` |
| `--fs` | Show filesystem structure | `sr list --fs` |
| `--diff` | Compare structure.sr vs filesystem | `sr list --diff` |
| `--show` | Display with icons | `sr list --show` |

### Your Daily Commands

#### Initialize & Setup
| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr init` | Creates starter `structure.sr` | Starting any new project |
| `sr init --empty` | Minimal structure with constraints block | When you want complete control |
| `sr init --from-fs ./project` | Generates `structure.sr` from existing code | Adopting Scaffoldrite in an existing project |
| `sr init --force` | Overwrites existing `structure.sr` | When you want to start fresh |

**Example:**
```bash
# Start a new React project
sr init
# Found an amazing open-source structure? Capture it!
sr init --from-fs ./awesome-repo --force
```

#### Validate & Check
| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr validate` | Checks if filesystem matches structure.sr | Before commits, in CI/CD |
| `sr validate --allow-extra` | Allows extra files not in structure | During migration phases |
| `sr validate --allow-extra README.md` | Allows specific extra files | When some files are intentionally outside structure |

**Example:**
```bash
# Strict check (CI/CD ready)
sr validate

# "We're migrating, be gentle"
sr validate --allow-extra

# "Only these can be extra"
sr validate --allow-extra README.md .env.example
```

#### Generate & Create
| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr generate` | Creates entire structure from structure.sr | Initial setup, resetting structure |
| `sr generate ./output` | Generates to specific directory | Creating templates for others |
| `sr generate --yes` | Skips confirmation prompts | Automation scripts |
| `sr generate --dry-run` | Shows what would happen | Preview before making changes |

**Example:**
```bash
# Create the whole structure
sr generate

# "Show me what you'll do first"
sr generate --dry-run

# "Just do it, I trust you"
sr generate --yes
```

#### Modify & Evolve
| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr create src/utils folder` | Adds folder to structure | Adding new feature areas |
| `sr create src/hooks/useAuth.ts file` | Adds file to structure | Creating new modules |
| `sr delete src/old-feature` | Removes from structure | Cleaning up tech debt |
| `sr rename src/index.ts main.ts` | Renames in structure | Refactoring |
| `sr update --from-fs .` | Updates structure.sr from current files | After manual tweaks |
| `sr merge --from-fs ./new-features` | Merges new files into structure | Collaborative feature adds |

**Example:**
```bash
# "We need a utils folder"
sr create src/utils folder

# "Actually, let's call it helpers"
sr rename src/utils src/helpers

# "Add a core utility file"
sr create src/helpers/format.ts file

# "Whoops, remove it"
sr delete src/helpers/format.ts
```

#### Inspect & Understand
| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `sr list` | Shows structure.sr contents | Quick reference |
| `sr list --fs` | Shows actual filesystem | Seeing current state |
| `sr list --diff` | Compares structure.sr vs filesystem | Finding discrepancies |
| `sr version` | Shows Scaffoldrite version | Debugging, reporting issues |

**Example:**
```bash
# "What's supposed to be here?"
sr list

# "What's actually here?"
sr list --fs

# "What's different?"
sr list --diff
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

**Example:**
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

These are your superpowers. They apply rules to multiple folders at once:

| Scope | Meaning | Visual Example |
|-------|---------|----------------|
| `*` | **Every direct child folder** (non-recursive) | `src/*` = `src/a/`, `src/b/`, but NOT `src/a/nested/` |
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
     eachFolderMustContainFile * packages/package.json
     eachFolderMustContain ** packages/src index.ts
   }
   ```
   "Every package must have package.json and README, and every src folder must have index.ts"

2. **Next.js API Route Standards:**
   ```sr
   constraints {
     eachFolderMustContainFile ** src/pages _app.tsx
     eachFolderMustContainFile * src/api GET.ts
     fileNameRegex src/api/* ^(GET|POST|PUT|DELETE|PATCH)\.ts$
   }
   ```
   "Every page needs _app.tsx, every API route needs GET.ts, and only HTTP methods allowed"

3. **React Component Organization:**
   ```sr
   constraints {
     eachFolderMustContain * src/features index.ts
     eachFolderMustContainFolder * src/features components
     eachFolderMustContainFile * src/features/components index.ts
     maxDepth src/features 3
   }
   ```
   "Every feature has the same structure: index.ts, components/ folder, and components have their own index.ts"

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

Sometimes you need exceptions. That's where `.scaffoldignore` comes in:

```ignore
# .scaffoldignore - works like .gitignore
node_modules/      # Ignore dependencies
*.log             # Ignore log files
dist/             # Ignore build output
.temp/            # Ignore temporary files

# But KEEP these in structure
!dist/README.md   # Except this one file
```

**Used when:**
- `sr init --from-fs` (snapshots ignore these)
- `sr validate` (validation ignores these)
- `sr list --fs` (listing ignores these)

**Not used when:**
- `sr generate` (generation respects full structure)

---

## 🎯 Real-World Workflows

### The Startup: Rapid Prototyping
```bash
# Day 1: Vision
sr init --empty
# Edit structure.sr with your dream structure
sr generate

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
sr validate  # Ensures compliance
# Can't violate standards even if they try
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
sr generate ./client-project
# Every client gets your proven structure
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
sr generate --yes

# Validate no regressions
sr validate --allow-extra  # Temporary allowance
```

---



## 🕰️ Structure History & Redo

Scaffoldrite **tracks structural operations** so you can safely revert changes to your project layout **without touching file content**.

### What It Solves

* **Recover from accidental folder deletion or moves**
  `sr restore <id> --before/after --fs/sr` restores your project’s structure to a previous state while keeping all file contents untouched.
* **Undo structural mistakes without losing work**
  Accidentally created folders, moved files, or renamed directories? Restore the correct layout without overwriting ongoing work.
* **Reset for scaffolding**
  When generating a new structure, you can start from a known-good layout, avoiding conflicts with extra or misplaced folders.

### Real-World Examples

1️⃣ **Cleaning up experimental folders**
**Situation:** You’ve been trying out new features and created temporary folders like `src/experimental/` or `test/` that you now don’t want in the project.
**Benefit:** Restore the structure to the intended state, removing only extra folders, but keep your edited files like `App.jsx` intact.

2️⃣ **Undoing accidental moves or renames**
**Situation:** You accidentally moved `components/Header.jsx` to the wrong folder.
**Benefit:** Restore the correct folder layout while keeping the file content unchanged. No need to overwrite your work, just fix the structure.

3️⃣ **Reverting after bad merges**
**Situation:** You merged someone else’s branch and it added or removed folders/files that don’t match your structure rules.
**Benefit:** Restore your intended folder hierarchy without discarding local content changes.

4️⃣ **Preparing for code generation or scaffolding**
**Situation:** You want to run `scaffoldrite generate` safely without accidentally overwriting content or creating misplaced folders.
**Benefit:** Restore the structure first, so scaffolding happens on a clean, known-good layout, reducing the chance of conflicts.

5️⃣ **Keeping projects consistent across teams**
**Situation:** In a team, different developers create new folders inconsistently.
**Benefit:** Restore the official folder structure for the project while letting each developer keep their own file content. Great for syncing structure without touching work-in-progress files.

6️⃣ **Cleaning old, unused boilerplate**
**Situation:** Over time, your project accumulates old template files, nested folders, or scaffolded test directories.
**Benefit:** Restore only the current intended structure, removing obsolete folders but leaving the real code untouched.

### What It Does **Not** Solve

* Scaffoldrite **does not backup file contents**. If a file was overwritten or manually deleted outside Scaffoldrite, history cannot restore its contents. Use **Git or another VCS** for content recovery.

> **Tip:** Think of `history restore` as a **structure-only undo/redo**. File content is never overwritten, making it ideal for cleaning, reorganizing, or prepping scaffolds without risk to your work.

---


## ❓ FAQ

### "What if I edit files manually?"
Run `sr validate` to check. Use `sr update --from-fs .` to accept changes, or `sr generate` to revert to structure.

### "Can I have multiple structure files?"
Not directly, but generate to different directories:
```bash
sr generate ./project-a
sr generate ./project-b
```

### "Is this like a linter for file structure?"
Exactly! It's ESLint/Prettier for your project's organization.

### "What about generated files?"
Add them to `.scaffoldignore` or use `--allow-extra` during validation.

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

**Your project's structure is code too. Treat it with the same care. With Scaffoldrite, you will.**

*Happy structuring! 🏗️*