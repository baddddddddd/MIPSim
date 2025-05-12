let registers = {};
const regAlias = {
  $0: '$zero', $1: '$at', $2: '$v0', $3: '$v1',
  $4: '$a0', $5: '$a1', $6: '$a2', $7: '$a3',
  $8: '$t0', $9: '$t1', $10: '$t2', $11: '$t3',
  $12: '$t4', $13: '$t5', $14: '$t6', $15: '$t7',
  $16: '$s0', $17: '$s1', $18: '$s2', $19: '$s3',
  $20: '$s4', $21: '$s5', $22: '$s6', $23: '$s7',
  $24: '$t8', $25: '$t9', $26: '$k0', $27: '$k1',
  $28: '$gp', $29: '$sp', $30: '$fp', $31: '$ra'
};

for (let [num, name] of Object.entries(regAlias)) {
  registers[name] = 0;
  // registers[num] = 0;
}

let memory = {};
let labelMap = {};
let programLines = [];
let curExecution = null;

function resetState() {
  for (let [num, name] of Object.entries(regAlias)) {
    registers[name] = 0;
  }

  memory = {};
  labelMap = {};
  programLines = [];

  renderMemory();
  renderRegisters();
}

function runCode() {
  resetState();
  clearTimeout(curExecution);
  curExecution = null;
  
  const code = document.getElementById("code").value.trim();
  const lines = code.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith('#'));

  programLines = [];
  labelMap = {};

  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes(":")) {
      const parts = line.split(":");
      const label = parts[0].trim();
      const rest = parts.slice(1).join(":").trim();
      labelMap[label] = lineIndex;
      
      if (rest) {
        programLines.push(label + ": " + rest);
        lineIndex++;
      } else {
        programLines.push(label + ":");
        lineIndex++;
      }
    } else {
      programLines.push(line);
      lineIndex++;
    }
  }


  const highlighted = document.getElementById("highlighted-code");
  highlighted.innerHTML = programLines.map(line => `<div>${highlightSyntax(line)}</div>`).join("");

  let i = 0;
  const executeLine = () => {
    if (i >= programLines.length) return;

    const divs = highlighted.querySelectorAll("div");
    divs.forEach(d => d.classList.remove("line-highlight"));
    divs[i].classList.add("line-highlight");

    const line = programLines[i];
    const jump = simulateInstruction(line, i);

    renderRegisters();
    renderMemory();

    i = jump !== undefined ? jump : i + 1;
    curExecution = setTimeout(() => executeLine(), 1000);
  };

  executeLine();
}

function simulateInstruction(line, currentIndex) {
  const tokens = line.replace(/,/g, '').split(/\s+/);
  const instr = tokens[0];

  const resolveReg = r => regAlias[r] || r;
  const regVal = r => registers[resolveReg(r)] ?? 0;

  switch (instr) {
    case 'add':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) + regVal(tokens[3]);
      break;
    case 'sub':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) - regVal(tokens[3]);
      break;
    case 'addi':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) + parseInt(tokens[3]);
      break;
    case 'and':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) & regVal(tokens[3]);
      break;
    case 'or':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) | regVal(tokens[3]);
      break;
    case 'lw': {
      const rt = resolveReg(tokens[1]);
      const [offset, base] = tokens[2].split(/[()]/);
      registers[rt] = memory[regVal(base) + parseInt(offset)] || 0;
      break;
    }
    case 'sw': {
      const rt = resolveReg(tokens[1]);
      const [offset, base] = tokens[2].split(/[()]/);
      memory[regVal(base) + parseInt(offset)] = regVal(rt);
      break;
    }
    case 'beq':
      if (regVal(tokens[1]) === regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'bne':
      if (regVal(tokens[1]) !== regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'blt':
      if (regVal(tokens[1]) < regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'ble':
      if (regVal(tokens[1]) <= regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'bgt':
      if (regVal(tokens[1]) > regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'bge':
      if (regVal(tokens[1]) >= regVal(tokens[2])) return labelMap[tokens[3]];
      break;
    case 'sll':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) << parseInt(tokens[3]);
      break;
    case 'srl':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) >>> parseInt(tokens[3]);
      break;
    case 'sra':
      registers[resolveReg(tokens[1])] = regVal(tokens[2]) >> parseInt(tokens[3]);
      break;
    case 'j':
      return labelMap[tokens[1]];
    case 'jal':
      registers['$ra'] = currentIndex + 1;
      return labelMap[tokens[1]];
    case 'jr':
      return regVal(tokens[1]);   
  }
}


function renderRegisters() {
  const container = document.getElementById("register-values");
  container.innerHTML = Object.keys(registers)
    .map(r => `<div><strong>${r}</strong>: ${registers[r]}</div>`)
    .join("");
}

function renderMemory() {
  const container = document.getElementById("memory-values");
  const sorted = Object.keys(memory)
    .map(addr => parseInt(addr))
    .sort((a, b) => a - b);
  container.innerHTML = sorted.map(a => `<div><strong>[${a}]</strong>: ${memory[a]}</div>`).join("") || "<i>No memory accessed yet</i>";
}

function highlightSyntax(line) {
  // highlight comment
  let comment = "";
  const commentSplit = line.split("#");
  if (commentSplit.length > 1) {
    comment = `<span class="comment">#${commentSplit.slice(1).join("#")}</span>`;
  }
  line = commentSplit[0];

  // highlight labels
  if (line.includes(":")) {
    const [label, rest] = line.split(":");
    return `<span class="label">${label.trim()}:</span> ${highlightSyntax(rest)} ${comment}`;
  }

  // tokenize and color
  return line.split(/\s+/).map(token => {
    // TK: UPDATE WHEN ADDING MORE INSTRUCTIONS
    if (/^(add|sub|addi|and|or|nor|slt|sll|srl|sra|lui|lw|sw|beq|bne|blt|ble|bgt|bge|j|jal|jr|nop)$/.test(token)) {
      return `<span class="instr">${token}</span>`;
    } else if (/^\$[a-z0-9]+$/i.test(token)) {
      return `<span class="reg">${token}</span>`;
    } else if (/^-?\d+$/.test(token)) {
      return `<span class="imm">${token}</span>`;
    } else if (token.trim() === "") {
      return "";
    } else {
      return token;
    }
  }).join(" ") + (comment ? ` ${comment}` : "");
}

resetState();