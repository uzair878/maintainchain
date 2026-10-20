// Generated from build/MaintainChain.json by scripts/compile.js. Do not edit by hand.
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_facilityName",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "machineId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "MachineRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recordId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "machineId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "technician",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "condition",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nextDueAt",
        "type": "uint256"
      }
    ],
    "name": "MaintenanceLogged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "technician",
        "type": "address"
      }
    ],
    "name": "TechnicianAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "technician",
        "type": "address"
      }
    ],
    "name": "TechnicianRemoved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_ID_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_TEXT_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tech",
        "type": "address"
      }
    ],
    "name": "addTechnician",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "facilityName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMachineIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      }
    ],
    "name": "getMachine",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "machineId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "registeredAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastServiceAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nextDueAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "serviceCount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct MaintainChain.Machine",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      }
    ],
    "name": "getMachineHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "machineId",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "technician",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "workDone",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "condition",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nextDueAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct MaintainChain.Record[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_recordId",
        "type": "uint256"
      }
    ],
    "name": "getRecord",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "machineId",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "technician",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "workDone",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "condition",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nextDueAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct MaintainChain.Record",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      }
    ],
    "name": "isOverdue",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isTechnician",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_workDone",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_condition",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_nextDueAt",
        "type": "uint256"
      }
    ],
    "name": "logMaintenance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "machineCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "recordCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      }
    ],
    "name": "registerMachine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tech",
        "type": "address"
      }
    ],
    "name": "removeTechnician",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      }
    ],
    "name": "roleOf",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "technicianCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
