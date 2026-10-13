#pragma once

#include <cstdint>
#include <string>
#include <vector>

class CPU {
public:
  CPU();
  void loadProgram(const std::string& source);
  std::string loadProgramError(const std::string& source);
  void reset();
  bool step();
  std::string stepError();
  std::uint32_t pc() const;
  std::uint32_t reg(int index) const;
  std::uint8_t readByte(int address) const;
  int instructionCount() const;
  int currentSourceLine() const;

private:
  struct Instruction {
    std::string name;
    int rd = 0;
    int rs1 = 0;
    int rs2 = 0;
    int immediate = 0;
    int line = 0;
  };

  std::uint32_t registers_[32] = {};
  std::uint8_t memory_[128] = {};
  std::vector<Instruction> program_;
  int pc_ = 0;
};
