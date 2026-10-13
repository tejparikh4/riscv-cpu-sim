# RISC-V CPU Simulator

A browser app for running basic RV32I assembly. The frontend is built with TypeScript and Vite app. The CPU is written C++, using Emscripten to compile it to WebAssembly.

## Use the simulator

Type assembly in the code box. Click **Step CPU** to run one instruction, **Run All** to run the entire program, and **Reset** to clear the CPU state.

Currently supported instructions: `addi`, `add`, `sub`, `and`, `or`, `lw`, `sw`, `beq`, `bne`, and `jal`. Labels are supported. Comments are not supported yet.

The simulator has 32 registers and 128 bytes of RAM.

## Run locally

Install Node.js and npm, then run:

```
cd web
npm install
npm run dev
```

## Rebuild the CPU

If you change the C++ files, activate Emscripten and run this from the repository root:

```sh
em++ -std=c++17 -O2 -fexceptions cpp/cpu.cpp cpp/bindings.cpp --bind --no-entry -sMODULARIZE=1 -sEXPORT_ES6=1 -o web/src/wasm/cpu.mjs
```

This updates `cpu.mjs` and `cpu.wasm` for the browser.