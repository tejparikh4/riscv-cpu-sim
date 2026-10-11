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
        const rowElem = document.createElement('tr');
        const nameElem = document.createElement('td');
        const valueElem = document.createElement('td');

        nameElem.textContent = 'x' + i;
        let value = registerValues[i].toString(16);
        while (value.length < 8) {
            value = '0' + value;
        }
        valueElem.textContent = '0x' + value;

        rowElem.appendChild(nameElem);
        rowElem.appendChild(valueElem);
        body.appendChild(rowElem);
    }
}

function updateRAMHTML(): void {
    const body = document.querySelector('#memory-table tbody') as HTMLTableSectionElement;
    body.textContent = '';

    for (let i = 0; i < RAMValues.length; i += 4) {
        const rowElem = document.createElement('tr');
        const addressElem = document.createElement('td');
        const valueElem = document.createElement('td');
        let value = '';

        for (let j = 0; j < 4; j++) {
            const byteValue = RAMValues[i + j];
            let byteHexNumber = byteValue.toString(16);
            while (byteHexNumber.length < 2) {
                byteHexNumber = '0' + byteHexNumber;
            }
            value += byteHexNumber;
        }

        let address = i.toString(16);

        while (address.length < 8) {
            address = '0' + address;
        }

        addressElem.textContent = '0x' + address;
        valueElem.textContent = '0x' + value;

        rowElem.appendChild(addressElem);
        rowElem.appendChild(valueElem);
        body.appendChild(rowElem);
    }
}

setAllRAMToZero();
setAllRegistersToZero();

// updateRegistersHTML();
// updateRAMHTML();


// function parseAssembly(source: string): ParsedInstruction[] {
    
// }