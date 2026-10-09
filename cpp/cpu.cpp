#include "cpu.hpp"

void CPU::reset() {
  pc_ = 0;
  x1_ = 0;
}

void CPU::step() {
  x1_ += 1;
  pc_ += 4;
}

std::uint32_t CPU::pc() const { return pc_; }
std::uint32_t CPU::x1() const { return x1_; }