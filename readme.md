Here’s your **clean, simplified, production-ready README** with **npx included** and a pointer to docs:

---

# Scaffoldrite: Define. Enforce. Generate.

> *Structure the right way*

**Stop guessing. Start structuring.**
Your project’s architecture should be as reliable as your code. Scaffoldrite makes it enforceable.

---

![ScaffoldRite Banner](https://raw.githubusercontent.com/isaacprogi/scaffoldrite/main/public/scaffoldrite-banner.png)

---

## 🚀 What is Scaffoldrite?

Scaffoldrite is a CLI tool that helps you:

* Define project structure in a single file (`structure.sr`)
* Enforce architecture rules with constraints
* Generate consistent project scaffolds
* Validate filesystem structure automatically

---

## ⚡ Quick Start

### Run instantly (recommended)

```bash id="8xq1p2"
npx scaffoldrite init
npx scaffoldrite generate .
```

---

### Or install globally

```bash id="k9d2lm"
npm install -g scaffoldrite
```

```bash id="p3xv8a"
sr init
sr generate .
```

---

## 📁 Core Idea

You define your project structure:

```sr id="structure_example"
folder src {
  folder components {
    file Button.tsx
  }
  file index.ts
}

constraints {
  mustContain src index.ts
}
```

Scaffoldrite ensures your filesystem matches this blueprint.

---

## 🧠 Key Features

* Declarative project structure (`structure.sr`)
* Enforceable constraints for architecture rules
* CLI-based workflow (init, generate, validate, update)
* Sync between filesystem and structure definition
* Template-friendly project generation

---

## 🛠 Common Commands

```bash id="cmds"
npx scaffoldrite init
npx scaffoldrite generate .
npx scaffoldrite validate
npx scaffoldrite update --from-fs .
npx scaffoldrite find Button
```

Or using global install:

```bash id="cmds_global"
sr init
sr generate .
sr validate
```

---

## 📦 Config Location (v2+)

```
.scaffoldrite/
├─ structure.sr
└─ .scaffoldignore
```

---

## 📖 Documentation

Full documentation, guides, and advanced usage:

👉 [https://github.com/isaacprogi/scaffoldrite](https://github.com/isaacprogi/scaffoldrite)

---

## 🤝 Community

* ⭐ Star: [https://github.com/Isaacprogi/scaffoldrite](https://github.com/Isaacprogi/scaffoldrite)
* 🐛 Issues: [https://github.com/Isaacprogi/scaffoldrite/issues](https://github.com/Isaacprogi/scaffoldrite/issues)
* 💬 Discussions: [https://github.com/Isaacprogi/scaffoldrite/discussions](https://github.com/Isaacprogi/scaffoldrite/discussions)

---

## 📄 License

MIT

---

**Your project structure is code. Treat it that way.**

*Happy structuring 🏗️*
