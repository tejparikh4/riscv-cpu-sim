#include <emscripten/bind.h>
#include "cpu.hpp"

EMSCRIPTEN_BINDINGS(riscv) {
  emscripten::class_<CPU>("CPU")
    .constructor<>()
    .function("loadProgramError", &CPU::loadProgramError)
    .function("reset", &CPU::reset)
    .function("stepError", &CPU::stepError)
    .function("pc", &CPU::pc)
    .function("reg", &CPU::reg)
    .function("readByte", &CPU::readByte)
    .function("instructionCount", &CPU::instructionCount)
    .function("currentSourceLine", &CPU::currentSourceLine);
}
