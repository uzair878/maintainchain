// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MaintainChain
 * @notice Tamper-proof maintenance log for industrial machines.
 *
 * Problem: In factories and workshops, machine service records are kept in paper
 * logbooks or editable spreadsheets. Entries can be back-dated, skipped or edited
 * after an accident or a failed audit, and nobody can prove who did the work.
 *
 * Solution: The facility owner registers machines and authorises technicians.
 * Only authorised technicians can log a service entry. Every entry is stamped with
 * the technician's wallet address and the block time and can never be edited or
 * deleted. Anyone (auditor, buyer of used equipment, insurer) can read the full
 * history and check whether a machine is overdue for service.
 *
 * Roles:
 *   owner      - deploys the contract, registers machines, adds/removes technicians
 *   technician - logs maintenance entries
 *   anyone     - reads machines, history and overdue status
 */
contract MaintainChain {
    // ------------------------------------------------------------------
    // State variables
    // ------------------------------------------------------------------

    address public owner;
    string public facilityName;
    uint256 public machineCount;
    uint256 public recordCount;
    uint256 public technicianCount;

    uint256 public constant MAX_ID_LENGTH = 32;
    uint256 public constant MAX_TEXT_LENGTH = 200;

    struct Machine {
        string machineId;
        string name;
        string location;
        uint256 registeredAt;
        uint256 lastServiceAt; // 0 until the first service is logged
        uint256 nextDueAt;     // 0 until the first service is logged
        uint256 serviceCount;
        bool exists;
    }

    struct Record {
        uint256 id;
        string machineId;
        address technician;
        string workDone;
        uint8 condition;       // 1 = critical ... 5 = excellent
        uint256 timestamp;
        uint256 nextDueAt;
    }

    mapping(string => Machine) private machines;
    string[] private machineIds;

    mapping(address => bool) public isTechnician;

    Record[] private records;
    mapping(string => uint256[]) private recordIdsByMachine;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event TechnicianAdded(address indexed technician);
    event TechnicianRemoved(address indexed technician);
    event MachineRegistered(string machineId, string name, string location, uint256 timestamp);
    event MaintenanceLogged(
        uint256 indexed recordId,
        string machineId,
        address indexed technician,
        uint8 condition,
        uint256 nextDueAt
    );

    // ------------------------------------------------------------------
    // Modifiers (authorisation)
    // ------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can do this");
        _;
    }

    modifier onlyTechnician() {
        require(isTechnician[msg.sender], "Only an authorised technician can log maintenance");
        _;
    }

    modifier machineExists(string memory _machineId) {
        require(machines[_machineId].exists, "Machine not found");
        _;
    }

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------

    constructor(string memory _facilityName) {
        require(bytes(_facilityName).length > 0, "Facility name is required");
        require(bytes(_facilityName).length <= MAX_TEXT_LENGTH, "Facility name is too long");

        owner = msg.sender;
        facilityName = _facilityName;

        // The owner is also allowed to log maintenance.
        isTechnician[msg.sender] = true;
        technicianCount = 1;
        emit TechnicianAdded(msg.sender);
    }

    // ------------------------------------------------------------------
    // Owner functions
    // ------------------------------------------------------------------

    function addTechnician(address _tech) external onlyOwner {
        require(_tech != address(0), "Invalid address");
        require(!isTechnician[_tech], "Already a technician");

        isTechnician[_tech] = true;
        technicianCount++;
        emit TechnicianAdded(_tech);
    }

    function removeTechnician(address _tech) external onlyOwner {
        require(_tech != owner, "Owner cannot be removed");
        require(isTechnician[_tech], "Not a technician");

        isTechnician[_tech] = false;
        technicianCount--;
        emit TechnicianRemoved(_tech);
    }

    function registerMachine(
        string memory _machineId,
        string memory _name,
        string memory _location
    ) external onlyOwner {
        require(bytes(_machineId).length > 0, "Machine ID is required");
        require(bytes(_machineId).length <= MAX_ID_LENGTH, "Machine ID is too long (max 32)");
        require(bytes(_name).length > 0, "Machine name is required");
        require(bytes(_name).length <= MAX_TEXT_LENGTH, "Machine name is too long");
        require(bytes(_location).length > 0, "Location is required");
        require(bytes(_location).length <= MAX_TEXT_LENGTH, "Location is too long");
        require(!machines[_machineId].exists, "Machine ID already registered");

        machines[_machineId] = Machine({
            machineId: _machineId,
            name: _name,
            location: _location,
            registeredAt: block.timestamp,
            lastServiceAt: 0,
            nextDueAt: 0,
            serviceCount: 0,
            exists: true
        });
        machineIds.push(_machineId);
        machineCount++;

        emit MachineRegistered(_machineId, _name, _location, block.timestamp);
    }

    // ------------------------------------------------------------------
    // Technician functions
    // ------------------------------------------------------------------

    function logMaintenance(
        string memory _machineId,
        string memory _workDone,
        uint8 _condition,
        uint256 _nextDueAt
    ) external onlyTechnician machineExists(_machineId) {
        require(bytes(_workDone).length > 0, "Describe the work done");
        require(bytes(_workDone).length <= MAX_TEXT_LENGTH, "Work description is too long (max 200)");
        require(_condition >= 1 && _condition <= 5, "Condition must be between 1 and 5");
        require(_nextDueAt > block.timestamp, "Next due date must be in the future");

        uint256 newId = records.length;
        records.push(Record({
            id: newId,
            machineId: _machineId,
            technician: msg.sender,
            workDone: _workDone,
            condition: _condition,
            timestamp: block.timestamp,
            nextDueAt: _nextDueAt
        }));
        recordIdsByMachine[_machineId].push(newId);
        recordCount++;

        Machine storage m = machines[_machineId];
        m.lastServiceAt = block.timestamp;
        m.nextDueAt = _nextDueAt;
        m.serviceCount++;

        emit MaintenanceLogged(newId, _machineId, msg.sender, _condition, _nextDueAt);
    }

    // ------------------------------------------------------------------
    // Read functions (free, anyone can call)
    // ------------------------------------------------------------------

    function getMachine(string memory _machineId)
        external
        view
        machineExists(_machineId)
        returns (Machine memory)
    {
        return machines[_machineId];
    }

    function getAllMachineIds() external view returns (string[] memory) {
        return machineIds;
    }

    function getMachineHistory(string memory _machineId)
        external
        view
        machineExists(_machineId)
        returns (Record[] memory)
    {
        uint256[] storage ids = recordIdsByMachine[_machineId];
        Record[] memory history = new Record[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            history[i] = records[ids[i]];
        }
        return history;
    }

    function getRecord(uint256 _recordId) external view returns (Record memory) {
        require(_recordId < records.length, "Record not found");
        return records[_recordId];
    }

    /// @notice True if the machine has a due date and that date has passed.
    function isOverdue(string memory _machineId)
        external
        view
        machineExists(_machineId)
        returns (bool)
    {
        Machine storage m = machines[_machineId];
        return m.nextDueAt != 0 && block.timestamp > m.nextDueAt;
    }

    /// @notice Returns 0 = owner, 1 = technician, 2 = viewer for the given address.
    function roleOf(address _account) external view returns (uint8) {
        if (_account == owner) return 0;
        if (isTechnician[_account]) return 1;
        return 2;
    }
}
