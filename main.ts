// Tiny stack VM (make.fun tiny-stack-vm-01): interpreter of generator/subject/ISA.md;
// generator/subject/vm.mjs is the rule. Reads /input/<id> (program.bin, input.bin),
// writes /output/<id>/stdout.bin and exit.txt for every id, in one run.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STACK_MAX = 256, CALLS_MAX = 64, MEM_WORDS = 256, STEP_LIMIT = 1000000, OUTPUT_MAX = 65536;
// [immediate bytes, pops, pushes] per opcode
const OPS = [
  [0, 0, 0], [1, 0, 1], [4, 0, 1], [0, 1, 0], [0, 1, 2], [0, 2, 2], [0, 2, 3], [0, 3, 3],
  [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 1, 1],
  [0, 2, 1], [0, 2, 1], [0, 2, 1], [0, 1, 1], [0, 2, 1], [0, 2, 1], [0, 2, 1],
  [0, 2, 1], [0, 2, 1], [0, 2, 1],
  [2, 0, 0], [2, 1, 0], [2, 1, 0], [2, 0, 0], [0, 0, 0],
  [0, 1, 1], [0, 2, 0], [0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 1, 0],
];
const OP_INDEX = new Uint8Array(256).fill(255);
const OPCODES = [0,1,2,3,4,5,6,7,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1a,0x1b,0x1c,0x1d,0x1e,0x20,0x21,0x22,0x30,0x31,0x32,0x33,0x34,0x40,0x41,0x50,0x51,0x52,0x53];
for (let i = 0; i < OPCODES.length; i++) OP_INDEX[OPCODES[i]] = i;

function run(p: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const n = p.length;
  const D = new Int32Array(STACK_MAX); let sp = 0;
  const C = new Int32Array(CALLS_MAX); let csp = 0;
  const M = new Int32Array(MEM_WORDS);
  const out = new Uint8Array(OUTPUT_MAX); let olen = 0;
  let ip = 0, pc = 0, steps = 0;
  const enc = new TextEncoder();
  const fail = (code: number) => ({ out: out.slice(0, olen), code });
  for (;;) {
    if (steps === STEP_LIMIT) return fail(10);
    if (pc < 0 || pc >= n) return fail(9);
    const op = p[pc];
    const oi = OP_INDEX[op];
    if (oi === 255) return fail(5);
    const imm = OPS[oi][0];
    if (pc + imm >= n) return fail(9);
    const pops = OPS[oi][1], pushes = OPS[oi][2];
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return fail(2);
    if (sp - pops + pushes > STACK_MAX) return fail(3);
    pc = next;
    switch (op) {
      case 0x00: return fail(0);
      case 0x01: D[sp++] = (p[next - 1] << 24) >> 24; break;
      case 0x02: D[sp++] = p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: {
        const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break;
      }
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: {
        const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break;
      }
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: {
        const b = D[sp - 1], a = D[sp - 2];
        let r = 0;
        switch (op) {
          case 0x10: r = (a + b) | 0; break;
          case 0x11: r = (a - b) | 0; break;
          case 0x12: r = Math.imul(a, b); break;
          case 0x13: if (b === 0) return fail(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; break;
          case 0x14: if (b === 0) return fail(4); r = b === -1 ? 0 : a % b | 0; break;
          case 0x15: if (b === 0) return fail(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; break;
          case 0x16: if (b === 0) return fail(4); r = (a >>> 0) % (b >>> 0) | 0; break;
          case 0x18: r = a & b; break;
          case 0x19: r = a | b; break;
          case 0x1a: r = a ^ b; break;
          case 0x1c: r = a << (b & 31); break;
          case 0x1d: r = a >> (b & 31); break;
          case 0x1e: r = (a >>> (b & 31)) | 0; break;
          case 0x20: r = a === b ? 1 : 0; break;
          case 0x21: r = a < b ? 1 : 0; break;
          case 0x22: r = (a >>> 0) < (b >>> 0) ? 1 : 0; break;
        }
        sp -= 2; D[sp++] = r; break;
      }
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) { const v = D[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = next + rel; break;
      }
      case 0x33:
        if (csp === CALLS_MAX) return fail(7);
        C[csp++] = next;
        pc = p[next - 2] | (p[next - 1] << 8);
        break;
      case 0x34:
        if (csp === 0) return fail(8);
        pc = C[--csp]; break;
      case 0x40: {
        const addr = D[sp - 1];
        if (addr < 0 || addr >= MEM_WORDS) return fail(6);
        D[sp - 1] = M[addr]; break;
      }
      case 0x41: {
        const addr = D[sp - 1];
        if (addr < 0 || addr >= MEM_WORDS) return fail(6);
        sp -= 2; M[addr] = D[sp]; break;
      }
      case 0x50: {
        const bytes = enc.encode(String(D[sp - 1]));
        if (olen + bytes.length > OUTPUT_MAX) return fail(11);
        sp--; out.set(bytes, olen); olen += bytes.length; break;
      }
      case 0x51:
        if (olen + 1 > OUTPUT_MAX) return fail(11);
        out[olen++] = D[--sp] & 255; break;
      case 0x52:
        D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 0x53:
        return fail(D[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(readFileSync(join(I, id, 'program.bin')), readFileSync(join(I, id, 'input.bin')));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), String(r.code) + '\n');
}
