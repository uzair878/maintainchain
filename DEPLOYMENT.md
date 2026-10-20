# Deployment details and transaction evidence

Fill this in after deploying. Copy hashes from the Remix terminal, the Ganache **Transactions** tab, or the DApp's transaction log.

## Environment

| Item | Value |
|---|---|
| Blockchain | Ganache local (desktop app / CLI) |
| RPC URL | `http://127.0.0.1:7545` |
| Chain ID | 1337 |
| IDE | Remix IDE, environment "Injected Provider – MetaMask" |
| Compiler | solc 0.8.24, EVM version `paris`, optimizer on (200 runs) |
| Wallet | MetaMask |

## Contract

| Item | Value |
|---|---|
| Contract address | `0x________________________________________` |
| Owner (deployer) | `0x________________________________________` |
| Technician account | `0x________________________________________` |
| Outsider account (for unauthorised tests) | `0x________________________________________` |
| Deployment tx hash | `0x________________________________________` |
| Deployment block | `__` |
| Gas used for deployment | `__________` |

## Transaction evidence

| # | Function | From | Result | Tx hash | Block |
|---|---|---|---|---|---|
| 1 | Constructor (deploy) | Owner | Success | `0x…` | |
| 2 | `registerMachine("CNC-01", …)` | Owner | Success | `0x…` | |
| 3 | `registerMachine("LATHE-03", …)` | Owner | Success | `0x…` | |
| 4 | `addTechnician(Account 2)` | Owner | Success | `0x…` | |
| 5 | `logMaintenance("CNC-01", …, 4, …)` | Technician | Success | `0x…` | |
| 6 | `logMaintenance("CNC-01", …, 9, …)` (force-sent) | Owner | Reverted: Condition must be between 1 and 5 | `0x…` | |
| 7 | `logMaintenance("CNC-01", …)` | Outsider | Reverted: Only an authorised technician can log maintenance | `0x…` | |
| 8 | `registerMachine("X-1", …)` | Outsider | Reverted: Only the owner can do this | `0x…` | |

## Reference run

The same flow was run end-to-end against a local Ganache chain (chain ID 1337) to check the frontend. Gas used, for reference:

| Transaction | Gas used |
|---|---|
| `registerMachine("CNC-01", "Haas VF-2 CNC mill", "Bay 2, line A")` | 216,923 |
| `registerMachine("LATHE-03", "Mazak QT lathe", "Bay 1")` | 182,603 |
| `addTechnician(…)` | 52,640 |
| `logMaintenance("CNC-01", …)` first entry | 348,092 |

Your numbers can differ slightly depending on string lengths.
