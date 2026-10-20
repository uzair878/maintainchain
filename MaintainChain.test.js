// Automated tests for MaintainChain: valid, invalid and unauthorised inputs.
// Runs against an in-memory Ganache chain. Usage: npm install && npm test
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const ganache = require("ganache");
const { ethers } = require("ethers");
const artifact = require("../build/MaintainChain.json");

let server, provider, owner, tech, outsider, c, cTech, cOut;
const DAY = 24 * 60 * 60;

async function now() {
  return (await provider.getBlock("latest")).timestamp;
}

// Ganache reports revert reasons in a nested error object, so look in every place they can appear.
function revertReason(err) {
  if (err.reason) return err.reason;
  if (err.info?.error?.data?.reason) return err.info.error.data.reason;
  const text = err.info?.error?.message || err.error?.message || err.message;
  const m = /revert(?:ed)?:?\s*(.+?)(?:"|$)/.exec(text);
  return m ? m[1] : err.shortMessage || err.message;
}

async function expectRevert(promise, reason) {
  await assert.rejects(promise, (err) => {
    const msg = revertReason(err);
    assert.ok(msg.includes(reason), `expected "${reason}", got "${msg}"`);
    return true;
  });
}

before(async () => {
  server = ganache.server({ logging: { quiet: true }, chain: { hardfork: "merge" }, wallet: { totalAccounts: 3 } });
  await server.listen(8545);
  provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, { cacheTimeout: -1 });
  [owner, tech, outsider] = await Promise.all([0, 1, 2].map((i) => provider.getSigner(i)));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
  c = await factory.deploy("Bay 2 Machine Shop");
  await c.waitForDeployment();
  cTech = c.connect(tech);
  cOut = c.connect(outsider);
});

after(async () => {
  provider.destroy();
  await server.close();
});

// ---------------- Valid inputs ----------------

test("V1 constructor sets owner and facility name", async () => {
  assert.strictEqual(await c.owner(), await owner.getAddress());
  assert.strictEqual(await c.facilityName(), "Bay 2 Machine Shop");
  assert.strictEqual(await c.isTechnician(await owner.getAddress()), true);
});

test("V2 owner registers a machine", async () => {
  await (await c.registerMachine("CNC-01", "Haas VF-2 CNC Mill", "Bay 2, Line A")).wait();
  const m = await c.getMachine("CNC-01");
  assert.strictEqual(m.name, "Haas VF-2 CNC Mill");
  assert.strictEqual(await c.machineCount(), 1n);
});

test("V3 owner adds a technician", async () => {
  await (await c.addTechnician(await tech.getAddress())).wait();
  assert.strictEqual(await c.isTechnician(await tech.getAddress()), true);
  assert.strictEqual(await c.roleOf(await tech.getAddress()), 1n);
});

test("V4 technician logs maintenance and history is stored", async () => {
  const due = (await now()) + 30 * DAY;
  await (await cTech.logMaintenance("CNC-01", "Spindle lubricated, coolant replaced", 4, due)).wait();
  const h = await c.getMachineHistory("CNC-01");
  assert.strictEqual(h.length, 1);
  assert.strictEqual(h[0].technician, await tech.getAddress());
  assert.strictEqual(h[0].condition, 4n);
  const m = await c.getMachine("CNC-01");
  assert.strictEqual(m.serviceCount, 1n);
  assert.strictEqual(m.nextDueAt, BigInt(due));
});

test("V5 overdue flag turns on after the due date passes", async () => {
  assert.strictEqual(await c.isOverdue("CNC-01"), false);
  await provider.send("evm_increaseTime", [31 * DAY]);
  await provider.send("evm_mine", []);
  assert.strictEqual(await c.isOverdue("CNC-01"), true);
});

test("V6 anyone (outsider) can read machine data", async () => {
  const ids = await cOut.getAllMachineIds();
  assert.deepStrictEqual([...ids], ["CNC-01"]);
  assert.strictEqual((await cOut.getMachineHistory("CNC-01")).length, 1);
});

// ---------------- Invalid inputs ----------------

test("I1 empty machine ID is rejected", async () => {
  await expectRevert(c.registerMachine("", "Lathe", "Bay 1"), "Machine ID is required");
});

test("I2 duplicate machine ID is rejected", async () => {
  await expectRevert(c.registerMachine("CNC-01", "Another mill", "Bay 3"), "Machine ID already registered");
});

test("I3 machine ID longer than 32 characters is rejected", async () => {
  await expectRevert(c.registerMachine("X".repeat(33), "Lathe", "Bay 1"), "Machine ID is too long");
});

test("I4 condition outside 1-5 is rejected", async () => {
  const due = (await now()) + 10 * DAY;
  await expectRevert(cTech.logMaintenance("CNC-01", "Checked belts", 7, due), "Condition must be between 1 and 5");
});

test("I5 next due date in the past is rejected", async () => {
  const past = (await now()) - DAY;
  await expectRevert(cTech.logMaintenance("CNC-01", "Checked belts", 3, past), "Next due date must be in the future");
});

test("I6 empty work description is rejected", async () => {
  const due = (await now()) + 10 * DAY;
  await expectRevert(cTech.logMaintenance("CNC-01", "", 3, due), "Describe the work done");
});

test("I7 logging against an unknown machine is rejected", async () => {
  const due = (await now()) + 10 * DAY;
  await expectRevert(cTech.logMaintenance("NOPE-99", "Checked belts", 3, due), "Machine not found");
});

test("I8 adding the zero address as technician is rejected", async () => {
  await expectRevert(c.addTechnician(ethers.ZeroAddress), "Invalid address");
});

// ---------------- Unauthorised inputs ----------------

test("U1 non-owner cannot register a machine", async () => {
  await expectRevert(cOut.registerMachine("LATHE-01", "Lathe", "Bay 1"), "Only the owner can do this");
});

test("U2 technician (not owner) cannot add technicians", async () => {
  await expectRevert(cTech.addTechnician(await outsider.getAddress()), "Only the owner can do this");
});

test("U3 outsider cannot log maintenance", async () => {
  const due = (await now()) + 10 * DAY;
  await expectRevert(cOut.logMaintenance("CNC-01", "Fake service entry", 5, due), "Only an authorised technician");
});

test("U4 removed technician loses access", async () => {
  await (await c.removeTechnician(await tech.getAddress())).wait();
  const due = (await now()) + 10 * DAY;
  await expectRevert(cTech.logMaintenance("CNC-01", "Late entry", 3, due), "Only an authorised technician");
});

test("U5 owner cannot be removed", async () => {
  await expectRevert(c.removeTechnician(await owner.getAddress()), "Owner cannot be removed");
});
