import './style.css'
import heroImg from './assets/hero.png'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import { setupCounter } from './counter.ts'

const codebox = document.getElementById('codebox');
const registers = document.getElementById('register-table');
const memory = document.getElementById('memory-table');


setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
