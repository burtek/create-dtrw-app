# ARCHITECTURE

## CREATE WORKFLOW

```plain
CLI
 ↓ validates args as much as possible without context/filesystem knowledge
Command Handler
 ↓ create fs-aware context
 ↓ validate args against the context and fs
 ↓ execute workspace-root preset
 ↓ execute additional presets from --starter an --with
 ↓ install deps, setup git
Done
```

### CODE LAYOUT

```plain
cli/create.ts, cli/dtrw.ts
 ↓ call
command/create.ts, command/dtrw.ts
 ↓ import and use
presets/*
 ↓ import and use
presets/sources/*
```

### PRESET

- stateless class instance, extends a base Preset abstract class that defines the contract
- each Preset makes use of a Source Strategy
- receives projectContext and targetPath from Command Handler
- executes Source strategy and additional preset-defined actions

### SOURCE

- stateless class instance, extends a base Strategy abstract class that defines the contract
- examples: TemplateSource, CommandSource, WebSource (will start with TemplateSource only; CommandSource is eg. angular)
- receives projectContext, targetPath and additional args
- additional args are what source needs and preset provides based on context and preset itself
- only executes it's single responsibility (copy template/execute command/download from web) 

## DTRW BIN

To be designed
