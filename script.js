// TK: ADD MORE REGISTERS
let registers = {
  $t0: 0, $t1: 0, $t2: 0, $t3: 0,
  $t4: 0, $t5: 0, $t6: 0, $t7: 0,
  $zero: 0
};

let memory = {};
let labelMap = {};
let programLines = [];

// TK: RESET REGISTERS AND MEMORY EVERYTIME CODE IS RUN
function runCode() {
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
    setTimeout(() => executeLine(), 1000);
  };

  executeLine();
}

function simulateInstruction(line, currentIndex) {
  const tokens = line.replace(/,/g, '').split(/\s+/);
  const instr = tokens[0];
  const regVal = r => registers[r] ?? 0;

  switch (instr) {
    case 'add':
      registers[tokens[1]] = regVal(tokens[2]) + regVal(tokens[3]);
      break;
    case 'sub':
      registers[tokens[1]] = regVal(tokens[2]) - regVal(tokens[3]);
      break;
    case 'addi':
      registers[tokens[1]] = regVal(tokens[2]) + parseInt(tokens[3]);
      break;
    case 'and':
      registers[tokens[1]] = regVal(tokens[2]) & regVal(tokens[3]);
      break;
    case 'or':
      registers[tokens[1]] = regVal(tokens[2]) | regVal(tokens[3]);
      break;
    case 'lw': {
      const rt = tokens[1];
      const [offset, base] = tokens[2].split(/[()]/);
      registers[rt] = memory[regVal(base) + parseInt(offset)] || 0;
      break;
    }
    case 'sw': {
      const rt = tokens[1];
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
    case 'j':
      return labelMap[tokens[1]];
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
    if (/^(add|sub|addi|and|or|lw|sw|beq|bne|j)$/.test(token)) {
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

