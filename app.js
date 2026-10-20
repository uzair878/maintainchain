// MaintainChain frontend: MetaMask connection, transactions and chain reads using Ethers.js v6.

let provider = null;  // ethers.BrowserProvider wrapping MetaMask
let signer = null;    // the connected account
let contract = null;  // contract instance bound to the signer

const $ = (id) => document.getElementById(id);
const short = (addr) => addr.slice(0, 6) + "…" + addr.slice(-4);
const DAY = 86400;

// ------------------------------------------------------------------
// Wallet connection
// ------------------------------------------------------------------

async function connectWallet() {
  hideBanner();
  if (!window.ethereum) {
    showBanner("MetaMask was not found. Install the MetaMask extension and open this page over http:// (for example with VS Code Live Server).");
    return;
  }
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    showBanner("Set CONTRACT_ADDRESS in frontend/config.js to the address shown in Remix after deployment.");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    const net = await provider.getNetwork();
    if (Number(net.chainId) !== EXPECTED_CHAIN_ID) {
      showBanner(`MetaMask is on chain ${net.chainId}, but the contract is on chain ${EXPECTED_CHAIN_ID}. Switch networks in MetaMask.`);
    }

    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      showBanner("No contract exists at CONTRACT_ADDRESS on this network. Check the address in config.js and the network in MetaMask.");
      return;
    }

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    $("connectBtn").textContent = "Connected";
    $("connectBtn").disabled = true;
    await refreshAll();
  } catch (err) {
    showBanner("Could not connect: " + readError(err));
  }
}

async function refreshWallet() {
  const address = await signer.getAddress();
  const [role, net, balance, facility] = await Promise.all([
    contract.roleOf(address),
    provider.getNetwork(),
    provider.getBalance(address),
    contract.facilityName(),
  ]);

  const roles = ["Owner", "Technician", "Viewer"];
  const roleName = roles[Number(role)];
  $("roleBadge").textContent = roleName;
  $("roleBadge").className = "role " + roleName.toLowerCase();
  $("account").textContent = short(address);
  $("account").title = address;
  $("network").textContent = `Chain ${net.chainId} · ${Number(ethers.formatEther(balance)).toFixed(3)} ETH`;
  $("walletInfo").hidden = false;
  $("facility").textContent = facility;
}

// ------------------------------------------------------------------
// Reading blockchain data
// ------------------------------------------------------------------

async function refreshAll() {
  await Promise.all([refreshWallet(), loadMachines()]);
}

function statusOf(m) {
  if (m.nextDueAt === 0n) return { text: "Never serviced", cls: "never" };
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(m.nextDueAt) - now;
  if (diff < 0) return { text: `Overdue by ${Math.ceil(-diff / DAY)} d`, cls: "overdue" };
  return { text: `Due in ${Math.ceil(diff / DAY)} d`, cls: "ok" };
}

async function loadMachines() {
  const [ids, mCount, rCount, tCount] = await Promise.all([
    contract.getAllMachineIds(),
    contract.machineCount(),
    contract.recordCount(),
    contract.technicianCount(),
  ]);
  $("statMachines").textContent = mCount.toString();
  $("statRecords").textContent = rCount.toString();
  $("statTechs").textContent = tCount.toString();

  const tbody = $("machineRows");
  if (ids.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No machines yet. The owner can register one using the form on the left.</td></tr>`;
    return;
  }

  const machines = await Promise.all(ids.map((id) => contract.getMachine(id)));
  tbody.innerHTML = "";
  machines.forEach((m) => {
    const s = statusOf(m);
    const tr = document.createElement("tr");
    tr.dataset.id = m.machineId;
    tr.tabIndex = 0;
    tr.innerHTML = `<td class="mono"></td><td></td><td></td><td>${m.serviceCount}</td><td class="status ${s.cls}">${s.text}</td>`;
    tr.children[0].textContent = m.machineId;
    tr.children[1].textContent = m.name;
    tr.children[2].textContent = m.location;
    tr.addEventListener("click", () => showHistory(m.machineId));
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") showHistory(m.machineId); });
    tbody.appendChild(tr);
  });
}

async function showHistory(machineId) {
  if (!requireContract()) return;
  const detail = $("machineDetail");
  const list = $("history");
  list.innerHTML = "";
  $("lookupForm").machineId.value = machineId;

  try {
    const [m, history, overdue] = await Promise.all([
      contract.getMachine(machineId),
      contract.getMachineHistory(machineId),
      contract.isOverdue(machineId),
    ]);

    const fmt = (t) => (t === 0n ? "—" : new Date(Number(t) * 1000).toLocaleString());
    detail.innerHTML = `<p><b></b></p><p></p><p></p><p></p>`;
    const p = detail.querySelectorAll("p");
    p[0].firstChild.textContent = `${m.machineId} · ${m.name}`;
    p[1].textContent = `Location: ${m.location}`;
    p[2].textContent = `Registered ${fmt(m.registeredAt)} · last service ${fmt(m.lastServiceAt)} · next due ${fmt(m.nextDueAt)}`;
    p[3].textContent = overdue ? "Status on chain: overdue for service" : `Status on chain: ${statusOf(m).text.toLowerCase()}`;
    p[3].className = overdue ? "status overdue" : "status";

    if (history.length === 0) {
      list.innerHTML = `<li class="empty">No service has been logged for this machine yet.</li>`;
      return;
    }

    [...history].reverse().forEach((r) => {
      const li = document.createElement("li");
      li.className = "tag" + (Number(r.condition) <= 2 ? " low" : "");
      li.innerHTML = `<h3></h3><p class="work"></p><p></p><p></p><p class="mono"></p>`;
      const parts = li.children;
      parts[0].textContent = `Service #${r.id} · condition ${r.condition}/5`;
      parts[1].textContent = r.workDone;
      parts[2].textContent = `Done ${fmt(r.timestamp)}`;
      parts[3].textContent = `Next due ${fmt(r.nextDueAt)}`;
      parts[4].textContent = `By ${r.technician}`;
      list.appendChild(li);
    });
  } catch (err) {
    detail.innerHTML = "";
    list.innerHTML = "";
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = readError(err);
    list.appendChild(li);
  }
}

// ------------------------------------------------------------------
// Sending transactions
// ------------------------------------------------------------------

// Runs a contract write. First simulates it (staticCall) to get the revert reason.
// If it would fail and "force send" is off, it is stopped before MetaMask opens.
// If force send is on, it is sent with a fixed gas limit so the revert is recorded on-chain.
async function sendTx(label, method, args, button) {
  if (!requireContract()) return;
  const force = $("forceSend").checked;
  const entry = logActivity(label, "pending", "Checking…");
  if (button) button.disabled = true;

  try {
    let reason = null;
    try {
      await contract[method].staticCall(...args);
    } catch (err) {
      reason = readError(err);
    }

    if (reason && !force) {
      updateActivity(entry, "failed", `Rejected by the contract before sending: ${reason}`);
      return;
    }

    const overrides = reason ? { gasLimit: 500000 } : {};
    updateActivity(entry, "pending", "Waiting for confirmation in MetaMask…");
    const tx = await contract[method](...args, overrides);
    updateActivity(entry, "pending", `Sent · tx ${tx.hash}`);

    const receipt = await tx.wait().catch((e) => e.receipt || Promise.reject(e));
    if (receipt && receipt.status === 1) {
      updateActivity(entry, "success",
        `Confirmed in block ${receipt.blockNumber} · gas used ${receipt.gasUsed} · tx ${receipt.hash}`);
      await refreshAll();
    } else {
      updateActivity(entry, "failed",
        `Reverted on-chain${reason ? ": " + reason : ""} · block ${receipt?.blockNumber} · tx ${receipt?.hash || tx.hash}`);
    }
  } catch (err) {
    updateActivity(entry, "failed", readError(err));
  } finally {
    if (button) button.disabled = false;
  }
}

// ------------------------------------------------------------------
// Form handlers
// ------------------------------------------------------------------

$("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  sendTx(`Register machine "${f.machineId.value}"`, "registerMachine",
    [f.machineId.value.trim(), f.name.value.trim(), f.location.value.trim()], e.submitter);
});

$("logForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const condition = Number(f.condition.value);
  if (!Number.isInteger(condition) || condition < 0 || condition > 255) {
    logActivity("Log service", "failed", "Condition must be a whole number. The contract accepts 1 to 5.");
    return;
  }
  // Due date = end of the chosen day (local time). Empty date sends 0, which the contract rejects.
  const due = f.nextDue.value ? Math.floor(new Date(f.nextDue.value + "T23:59:59").getTime() / 1000) : 0;
  sendTx(`Log service on "${f.machineId.value}"`, "logMaintenance",
    [f.machineId.value.trim(), f.workDone.value.trim(), condition, due], e.submitter);
});

$("techForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const addr = e.target.address.value.trim();
  const action = e.submitter?.dataset.action || "add";
  if (!ethers.isAddress(addr)) {
    logActivity(action === "add" ? "Add technician" : "Remove technician", "failed",
      "That is not a valid Ethereum address. It should start with 0x followed by 40 hex characters.");
    return;
  }
  if (action === "add") sendTx(`Add technician ${short(addr)}`, "addTechnician", [addr], e.submitter);
  else sendTx(`Remove technician ${short(addr)}`, "removeTechnician", [addr], e.submitter);
});

$("lookupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = e.target.machineId.value.trim();
  if (id) showHistory(id);
});

$("connectBtn").addEventListener("click", connectWallet);
$("refreshBtn").addEventListener("click", () => requireContract() && refreshAll());

// Reload when the user switches account or network in MetaMask so the role badge stays correct.
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

// Default the due-date picker to 30 days from today.
$("logForm").nextDue.valueAsDate = new Date(Date.now() + 30 * DAY * 1000);

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function requireContract() {
  if (contract) return true;
  showBanner("Connect MetaMask first.");
  return false;
}

// Pulls a readable message out of the many error shapes MetaMask, Ganache and ethers produce.
function readError(err) {
  if (err?.code === "ACTION_REJECTED" || err?.info?.error?.code === 4001) {
    return "You rejected the transaction in MetaMask.";
  }
  if (err?.reason) return err.reason;

  const text = JSON.stringify(err, (k, v) => (typeof v === "bigint" ? v.toString() : v)) || "";

  // Standard Error(string) revert data: 0x08c379a0 + abi-encoded string
  const hex = /0x08c379a0[0-9a-fA-F]+/.exec(text);
  if (hex) {
    try {
      return ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + hex[0].slice(10))[0];
    } catch (_) { /* fall through */ }
  }
  const revert = /revert(?:ed)?:?\s+([^"\\]+)/i.exec(text);
  if (revert) return revert[1].trim();

  return err?.shortMessage || err?.message || "Unknown error";
}

function showBanner(msg) { $("banner").textContent = msg; $("banner").hidden = false; }
function hideBanner() { $("banner").hidden = true; }

function logActivity(label, state, detail) {
  const list = $("activity");
  const placeholder = list.querySelector(".empty");
  if (placeholder) placeholder.remove();
  const li = document.createElement("li");
  li.innerHTML = `<div><span class="res"></span> <span class="what"></span></div><div class="meta"></div>`;
  li.querySelector(".what").textContent = `${label} · ${new Date().toLocaleTimeString()}`;
  list.prepend(li);
  updateActivity(li, state, detail);
  return li;
}

function updateActivity(li, state, detail) {
  const res = li.querySelector(".res");
  res.className = "res " + state;
  res.textContent = { success: "Success", failed: "Failed", pending: "Pending" }[state];
  li.querySelector(".meta").textContent = detail;
}
