#include <emscripten/bind.h>
#include "cpu.hpp"

EMSCRIPTEN_BINDINGS(riscv) {
  emscripten::class_<CPU>("CPU")
    .constructor<>()
    .function("reset", &CPU::reset)
    .function("step", &CPU::step)
    .function("pc", &CPU::pc)
    .function("x1", &CPU::x1);
}