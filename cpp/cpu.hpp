#pragma once
#include <cstdint>

class CPU {
public:
  void reset();
  void step();
  std::uint32_t pc() const;
  std::uint32_t x1() const;

private:
  std::uint32_t pc_ = 0;
  std::uint32_t x1_ = 0;
};