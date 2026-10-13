#include "cpu.hpp"

#include <cctype>
#include <map>
#include <sstream>
#include <stdexcept>

using namespace std;

string trim(const string& text) {
  int first = text.find_first_not_of(" \t\r");
  if (first == -1) return "";
  int last = text.find_last_not_of(" \t\r");
  return text.substr(first, last - first + 1);
}

string messageForLine(int line, const string& message) {
  return "Line " + to_string(line) + ": " + message;
}

int readNumber(const string& text, int line) {
  int base = 10;
  int start = 0;
  if (!text.empty() && (text[0] == '-' || text[0] == '+')) start = 1;
  if (text.substr(start, 2) == "0x" || text.substr(start, 2) == "0X") base = 16;

  try {
    size_t used = 0;
    int number = stoi(text, &used, base);
    if (used == text.size()) return number;
  } catch (const exception&) {
  }
  throw runtime_error(messageForLine(line, "invalid number '" + text + "'"));
}

int readRegister(const string& text, int line) {
  if (text.size() < 2 || text.size() > 3 || text[0] != 'x') {
    throw runtime_error(messageForLine(line, "expected a register x0 through x31"));
  }
  for (int i = 1; i < static_cast<int>(text.size()); i++) {
    if (!isdigit(static_cast<unsigned char>(text[i]))) {
      throw runtime_error(messageForLine(line, "invalid register '" + text + "'"));
    }
  }
  int number = stoi(text.substr(1));
  if (number > 31) {
    throw runtime_error(messageForLine(line, "register '" + text + "' is out of range"));
  }
  return number;
}

vector<string> readOperands(const string& text, int count, int line) {
  vector<string> result;
  int start = 0;
  for (int i = 0; i <= static_cast<int>(text.size()); i++) {
    if (i == static_cast<int>(text.size()) || text[i] == ',') {
      result.push_back(trim(text.substr(start, i - start)));
      start = i + 1;
    }
  }
  if (static_cast<int>(result.size()) != count) {
    throw runtime_error(messageForLine(line, "expected " + to_string(count) + " comma-separated operands"));
  }
  for (const string& part : result) {
    if (part.empty()) throw runtime_error(messageForLine(line, "empty operand"));
  }
  return result;
}

bool validLabel(const string& text) {
  if (text.empty()) return false;
  if (!isalpha(static_cast<unsigned char>(text[0])) && text[0] != '_') return false;
  for (char letter : text) {
    if (!isalnum(static_cast<unsigned char>(letter)) && letter != '_') return false;
  }
  return true;
}

void checkRange(int number, int lowest, int highest, int line) {
  if (number < lowest || number > highest) {
    throw runtime_error(messageForLine(line, "immediate must be between " +
        to_string(lowest) + " and " + to_string(highest)));
  }
}

CPU::CPU() = default;

void CPU::loadProgram(const string& source) {
  struct SourceLine {
    string text;
    int number;
  };
  vector<SourceLine> lines;
  map<string, int> labels;
  istringstream input(source);
  string text;
  int lineNumber = 0;

  while (getline(input, text)) {
    lineNumber++;
    text = trim(text);
    int colon = text.find(':');
    if (colon != -1) {
      string label = trim(text.substr(0, colon));
      if (!validLabel(label)) {
        throw runtime_error(messageForLine(lineNumber, "invalid label '" + label + "'"));
      }
      if (labels.count(label) != 0) {
        throw runtime_error(messageForLine(lineNumber, "duplicate label '" + label + "'"));
      }
      labels[label] = static_cast<int>(lines.size()) * 4;
      text = trim(text.substr(colon + 1));
    }
    if (!text.empty()) lines.push_back({text, lineNumber});
  }

  vector<Instruction> newProgram;
  for (int i = 0; i < static_cast<int>(lines.size()); i++) {
    istringstream lineInput(lines[i].text);
    Instruction ins;
    ins.line = lines[i].number;
    lineInput >> ins.name;
    string rest;
    getline(lineInput, rest);
    rest = trim(rest);

    if (ins.name == "addi") {
      vector<string> parts = readOperands(rest, 3, ins.line);
      ins.rd = readRegister(parts[0], ins.line);
      ins.rs1 = readRegister(parts[1], ins.line);
      ins.immediate = readNumber(parts[2], ins.line);
      checkRange(ins.immediate, -2048, 2047, ins.line);
    } else if (ins.name == "add" || ins.name == "sub" || ins.name == "and" || ins.name == "or") {
      vector<string> parts = readOperands(rest, 3, ins.line);
      ins.rd = readRegister(parts[0], ins.line);
      ins.rs1 = readRegister(parts[1], ins.line);
      ins.rs2 = readRegister(parts[2], ins.line);
    } else if (ins.name == "lw" || ins.name == "sw") {
      vector<string> parts = readOperands(rest, 2, ins.line);
      ins.rd = readRegister(parts[0], ins.line);
      string address = parts[1];
      int open = address.find('(');
      int close = address.find(')');
      if (open == -1 || close != static_cast<int>(address.size()) - 1) {
        throw runtime_error(messageForLine(ins.line, "expected offset(xN), for example 4(x2)"));
      }
      ins.immediate = readNumber(trim(address.substr(0, open)), ins.line);
      checkRange(ins.immediate, -2048, 2047, ins.line);
      ins.rs1 = readRegister(trim(address.substr(open + 1, close - open - 1)), ins.line);
    } else if (ins.name == "beq" || ins.name == "bne" || ins.name == "jal") {
      bool jump = ins.name == "jal";
      vector<string> parts = readOperands(rest, jump ? 2 : 3, ins.line);
      string target;
      if (jump) {
        ins.rd = readRegister(parts[0], ins.line);
        target = parts[1];
      } else {
        ins.rs1 = readRegister(parts[0], ins.line);
        ins.rs2 = readRegister(parts[1], ins.line);
        target = parts[2];
      }
      if (labels.count(target) != 0) {
        ins.immediate = labels[target] - i * 4;
      } else {
        ins.immediate = readNumber(target, ins.line);
      }
      if (jump) checkRange(ins.immediate, -1048576, 1048574, ins.line);
      else checkRange(ins.immediate, -4096, 4094, ins.line);
      if (ins.immediate % 4 != 0) {
        throw runtime_error(messageForLine(ins.line, "branch/jump offset must be a multiple of 4 bytes"));
      }
    } else {
      throw runtime_error(messageForLine(ins.line, "unsupported instruction '" + ins.name + "'"));
    }
    newProgram.push_back(ins);
  }

  program_ = newProgram;
  reset();
}

string CPU::loadProgramError(const string& source) {
  try {
    loadProgram(source);
    return "";
  } catch (const exception& error) {
    return error.what();
  }
}

void CPU::reset() {
  for (int i = 0; i < 32; i++) registers_[i] = 0;
  for (int i = 0; i < 128; i++) memory_[i] = 0;
  pc_ = 0;
}

bool CPU::step() {
  if (pc_ == static_cast<int>(program_.size()) * 4) return false;
  if (pc_ < 0 || pc_ % 4 != 0 || pc_ / 4 > static_cast<int>(program_.size())) {
    throw runtime_error("Program counter is outside the program");
  }

  Instruction ins = program_[pc_ / 4];
  uint32_t a = registers_[ins.rs1];
  uint32_t b = registers_[ins.rs2];
  int nextPC = pc_ + 4;

  if (ins.name == "addi") registers_[ins.rd] = a + ins.immediate;
  else if (ins.name == "add") registers_[ins.rd] = a + b;
  else if (ins.name == "sub") registers_[ins.rd] = a - b;
  else if (ins.name == "and") registers_[ins.rd] = a & b;
  else if (ins.name == "or") registers_[ins.rd] = a | b;
  else if (ins.name == "lw" || ins.name == "sw") {
    uint32_t address = a + ins.immediate;
    if (address % 4 != 0 || address > 124) {
      throw runtime_error(messageForLine(ins.line, "word address must be aligned and within RAM (0-124)"));
    }
    if (ins.name == "lw") {
      uint32_t value = 0;
      for (int i = 0; i < 4; i++) {
        uint32_t oneByte = memory_[address + i];
        value += oneByte << (8 * i);
      }
      registers_[ins.rd] = value;
    } else {
      uint32_t value = registers_[ins.rd];
      for (int i = 0; i < 4; i++) memory_[address + i] = (value >> (8 * i)) & 255;
    }
  } else if (ins.name == "beq") {
    if (a == b) nextPC = pc_ + ins.immediate;
  } else if (ins.name == "bne") {
    if (a != b) nextPC = pc_ + ins.immediate;
  } else if (ins.name == "jal") {
    registers_[ins.rd] = pc_ + 4;
    nextPC = pc_ + ins.immediate;
  }

  if (nextPC < 0 || nextPC > static_cast<int>(program_.size()) * 4) {
    throw runtime_error(messageForLine(ins.line, "branch/jump leaves the program"));
  }
  registers_[0] = 0;
  pc_ = nextPC;
  return pc_ < static_cast<int>(program_.size()) * 4;
}

string CPU::stepError() {
  try {
    step();
    return "";
  } catch (const exception& error) {
    return error.what();
  }
}

uint32_t CPU::pc() const { return pc_; }

uint32_t CPU::reg(int index) const {
  if (index < 0 || index >= 32) throw out_of_range("invalid register index");
  return registers_[index];
}

uint8_t CPU::readByte(int address) const {
  if (address < 0 || address >= 128) throw out_of_range("invalid RAM address");
  return memory_[address];
}

int CPU::instructionCount() const { return program_.size(); }

int CPU::currentSourceLine() const {
  if (pc_ < 0 || pc_ % 4 != 0 || pc_ / 4 >= static_cast<int>(program_.size())) return 0;
  return program_[pc_ / 4].line;
}
