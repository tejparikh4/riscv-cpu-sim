import createModule from './wasm/cpu.mjs';
import wasmUrl from './wasm/cpu.wasm?url';

type CPU = {
  reset(): void;
  step(): void;
  pc(): number;
  x1(): number;
  delete(): void;
};

type CPUModule = { CPU: new () => CPU };

const wasm = (await createModule({
  locateFile: (name: string) => name.endsWith('wasm') ? wasmUrl : name,
})) as CPUModule;

const cpu = new wasm.CPU();

console.log(cpu.pc(), cpu.x1());
cpu.step();
console.log(cpu.pc(), cpu.x1());


const codebox = document.getElementById('codebox');
const registers = document.getElementById('register-table');
const memory = document.getElementById('memory-table');


function readFromRegister(register: number): number {
  return 1;
}

function writeToRegister(register: number, value: number): void {

}

