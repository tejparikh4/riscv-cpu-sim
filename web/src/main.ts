import createModule from './wasm/cpu.mjs';
import wasmUrl from './wasm/cpu.wasm?url';

const numRegisters = 32;
const numBytesRAM = 128;

type CPU = {
    loadProgramError(source: string): string;
    stepError(): string;
    reset(): void;
    pc(): number;
    reg(index: number): number;
    readByte(address: number): number;
    instructionCount(): number;
    currentSourceLine(): number;
    delete(): void;
};

type CPUModule = { CPU: new () => CPU };

const wasm = (await createModule({
    locateFile: (name: string) => name.endsWith('wasm') ? wasmUrl : name,
})) as CPUModule;

const cpu = new wasm.CPU();

const codebox = document.getElementById('codebox') as HTMLTextAreaElement;

let registerValues: number[] = [];

for (let i: number = 0; i < numRegisters; i++) {
    registerValues.push(0);
}

let RAMValues: number[] = [];

for (let i: number = 0; i < numBytesRAM; i++) {
    RAMValues.push(0);
}

const stepButton = document.getElementById('step-button') as HTMLButtonElement;
stepButton.addEventListener('click', () => {
    clearError();
    try {
        loadIfNeeded();
        if (cpu.currentSourceLine() === 0) cpu.reset();
        executeStep();
    } catch (error) {
        showError(error);
    }
});

function writeToRegister(register: number, value: number): void {
    if (register < 0 || register >= numRegisters) {
        throw new Error("Invalid register address");
    }
    registerValues[register] = value;
}

function writeToRAM(address: number, value: number): void {
    if (address < 0 || address >= numBytesRAM) {
        throw new Error("Invalid RAM address");
    }
    RAMValues[address] = value;
}

function setAllRegistersToZero(): void {
    for (let i = 0; i < numRegisters; i++) {
        writeToRegister(i, 0);
    }

}

function setAllRAMToZero(): void {
    for (let i = 0; i < numBytesRAM; i++) {
        writeToRAM(i, 0);
    }
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
            const byteValue = RAMValues[i + 3 - j];
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
updateRegistersHTML();
updateRAMHTML();

function copyCPUToTables(): void {
    for (let i = 0; i < numRegisters; i++) {
        writeToRegister(i, cpu.reg(i));
    }
    for (let i = 0; i < numBytesRAM; i++) {
        writeToRAM(i, cpu.readByte(i));
    }
    updateRegistersHTML();
    updateRAMHTML();
}

const activeLine = document.getElementById('active-line') as HTMLDivElement;
const runButton = document.getElementById('run-all-button') as HTMLButtonElement;
const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
const speed = document.getElementById('execution-speed') as HTMLInputElement;
const status = document.getElementById('execution-status') as HTMLParagraphElement;
const errorDisplay = document.getElementById('assembly-error') as HTMLParagraphElement;

let loadedSource: string | null = null;
let timer: number | undefined;
let highlightedLine = 0;

function hex(value: number): string {
    return '0x' + value.toString(16).padStart(8, '0');
}

function highlight(line: number): void {
    highlightedLine = line;
    if (line === 0) {
        activeLine.style.display = 'none';
        return;
    }
    const lineHeight = parseFloat(getComputedStyle(codebox).lineHeight);
    const paddingTop = parseFloat(getComputedStyle(codebox).paddingTop);
    const top = paddingTop + (line - 1) * lineHeight;
    if (top < codebox.scrollTop || top + lineHeight > codebox.scrollTop + codebox.clientHeight) {
        codebox.scrollTop = Math.max(0, top - codebox.clientHeight / 2);
    }
    activeLine.style.top = `${top - codebox.scrollTop}px`;
    activeLine.style.height = `${lineHeight}px`;
    activeLine.style.display = 'block';
}

function stopRunning(): void {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    runButton.textContent = 'Run All';
    stepButton.disabled = false;
}

function clearError(): void {
    errorDisplay.hidden = true;
    errorDisplay.textContent = '';
}

function showError(error: unknown): void {
    stopRunning();
    const message = error instanceof Error ? error.message : String(error);
    errorDisplay.textContent = message;
    errorDisplay.hidden = false;
    status.textContent = 'Stopped on error.';
    const match = /^Line (\d+):/.exec(message);
    highlight(match ? Number(match[1]) : 0);
}

function loadIfNeeded(): void {
    if (loadedSource === codebox.value) return;
    const error = cpu.loadProgramError(codebox.value);
    if (error) throw new Error(error);
    if (cpu.instructionCount() === 0) throw new Error('Enter at least one instruction.');
    loadedSource = codebox.value;
    copyCPUToTables();
}

function executeStep(): void {
    const line = cpu.currentSourceLine();
    const error = cpu.stepError();
    copyCPUToTables();
    if (error) throw new Error(error);
    highlight(line);
    if (cpu.currentSourceLine() === 0) {
        stopRunning();
        status.textContent = `Finished after line ${line}. PC is ${hex(cpu.pc())}.`;
    } else {
        status.textContent = '';
    }
}

function scheduleStep(): void {
    timer = window.setTimeout(() => {
        timer = undefined;
        try {
            executeStep();
            if (cpu.currentSourceLine() !== 0) scheduleStep();
        } catch (error) {
            showError(error);
        }
    }, 1100 - Number(speed.value) * 100);
}

runButton.addEventListener('click', () => {
    if (timer !== undefined) {
        stopRunning();
        status.textContent = `Paused at PC ${hex(cpu.pc())}.`;
        return;
    }
    clearError();
    try {
        loadIfNeeded();
        if (cpu.currentSourceLine() === 0) {
            cpu.reset();
            copyCPUToTables();
            highlight(0);
        }
        status.textContent = `Running from PC ${hex(cpu.pc())}.`;
        stepButton.disabled = true;
        runButton.textContent = 'Pause';
        scheduleStep();
    } catch (error) {
        showError(error);
    }
});

resetButton.addEventListener('click', () => {
    stopRunning();
    cpu.reset();
    clearError();
    copyCPUToTables();
    highlight(0);
    status.textContent = 'Reset. Click Step CPU to advance one instruction forward or Run All to run the entire program.';
});

codebox.addEventListener('input', () => {
    stopRunning();
    loadedSource = null;
    cpu.reset();
    copyCPUToTables();
    clearError();
    highlight(0);
    status.textContent = 'Code changed. Click Step CPU to advance one instruction forward or Run All to run the entire program.';
});

codebox.addEventListener('scroll', () => {
    if (highlightedLine === 0) return;
    const lineHeight = parseFloat(getComputedStyle(codebox).lineHeight);
    const paddingTop = parseFloat(getComputedStyle(codebox).paddingTop);
    activeLine.style.top = `${paddingTop + (highlightedLine - 1) * lineHeight - codebox.scrollTop}px`;
});
