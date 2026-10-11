import createModule from './wasm/cpu.mjs';
import wasmUrl from './wasm/cpu.wasm?url';

const numRegisters = 32;
const numBytesRAM = 128;

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

// console.log(cpu.pc(), cpu.x1());

const codebox = document.getElementById('codebox');

let registerValues: number[] = [];

for (let i: number = 0; i < numRegisters; i++) {
    registerValues.push(0);
}

let RAMValues: number[] = [];

for (let i: number = 0; i < numBytesRAM; i++) {
    RAMValues.push(0);
}

const stepButton = document.getElementById('step-button') as HTMLElement;
stepButton.addEventListener('click', () => {
    // console.log("Parsed assembly:", parsedInstructions);
    cpu.step();

    console.log(cpu.pc(), cpu.x1());
});

function writeToRegister(register: number, value: number): void {
    if (register <= 0 || register >= registerValues.length) {
        throw new Error("Invalid register address");
    }
    registerValues[register] = value >>> 0;
}

function setAllRegistersToZero(): void {
    for (let i = 0; i < registerValues.length; i++) {
        registerValues[i] = 0;
    }
    updateRegistersHTML();
}

function setAllRAMToZero(): void {
    for (let i = 0; i < RAMValues.length; i++) {
        RAMValues[i] = 0;
    }
    updateRAMHTML();
}

function updateRegistersHTML(): void {
    const body = document.querySelector('#register-table tbody') as HTMLTableSectionElement;
    body.textContent = '';

    for (let i = 0; i < registerValues.length; i++) {
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const value = document.createElement('td');

        name.textContent = 'x' + i;
        value.textContent = String(registerValues[i]);

        row.appendChild(name);
        row.appendChild(value);
        body.appendChild(row);
    }
}

function updateRAMHTML(): void {
    const body = document.querySelector('#memory-table tbody') as HTMLTableSectionElement;
    body.textContent = '';

    for (let i = 0; i < RAMValues.length; i++) {
        const row = document.createElement('tr');
        const address = document.createElement('td');
        const value = document.createElement('td');

        address.textContent = String(i);
        value.textContent = String(RAMValues[i]);

        row.appendChild(address);
        row.appendChild(value);
        body.appendChild(row);
    }
}

updateRegistersHTML();
updateRAMHTML();


// function parseAssembly(source: string): ParsedInstruction[] {
    
// }