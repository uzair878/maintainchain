// Compiles contracts/MaintainChain.sol and writes ABI + bytecode to build/
// evmVersion "paris" matches Ganache (it does not support the PUSH0 opcode used by newer EVM targets).
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const source = fs.readFileSync(path.join(__dirname, "..", "contracts", "MaintainChain.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "MaintainChain.sol": { content: source } },
  settings: {
    evmVersion: "paris",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (out.errors || []).filter((e) => e.severity === "error");
(out.errors || []).forEach((e) => console.log(e.formattedMessage));
if (errors.length) process.exit(1);

const c = out.contracts["MaintainChain.sol"].MaintainChain;
fs.mkdirSync(path.join(__dirname, "..", "build"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "..", "build", "MaintainChain.json"),
  JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
);
fs.writeFileSync(
  path.join(__dirname, "..", "frontend", "abi.js"),
  "// Generated from build/MaintainChain.json by scripts/compile.js. Do not edit by hand.\nconst CONTRACT_ABI = " +
    JSON.stringify(c.abi, null, 2) + ";\n"
);
console.log(`Compiled with solc ${solc.version()} -> build/MaintainChain.json and frontend/abi.js`);
