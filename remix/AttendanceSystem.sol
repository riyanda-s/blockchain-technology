// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AttendanceSystem {
    address public owner;
    uint public hadirCount;
    uint public alphaCount;
    uint public izinCount;
    address[] public recordedList;

    mapping(address => bool) public hasRecorded;
    event AttendanceRecorded(address indexed student, string status);
    constructor() {
        owner = msg.sender;
    }

    function markHadir() public {
        require(!hasRecorded[msg.sender], "You have already recorded your attendance");
        hasRecorded[msg.sender] = true;
        recordedList.push(msg.sender);
        hadirCount += 1;
        emit AttendanceRecorded(msg.sender, "Hadir");
    }

    function markAlpha() public {
        require(!hasRecorded[msg.sender], "You have already recorded your attendance");
        hasRecorded[msg.sender] = true;
        recordedList.push(msg.sender);
        alphaCount += 1;
        emit AttendanceRecorded(msg.sender, "Alpha");
    }

    function markIzin() public {
        require(!hasRecorded[msg.sender], "You have already recorded your attendance");
        hasRecorded[msg.sender] = true;
        recordedList.push(msg.sender);
        izinCount += 1;
        emit AttendanceRecorded(msg.sender, "Izin");
    }

    function getTotalAttendance() public view returns (uint totalHadir, uint totalAlpha, uint totalIzin, uint grandTotal) {
        uint total = hadirCount + alphaCount + izinCount;
        return (hadirCount, alphaCount, izinCount, total);
    }

    function resetAttendance() public {
        require(msg.sender == owner, "Only owner can reset attendance");
        for (uint i = 0; i < recordedList.length; i++) {
            hasRecorded[recordedList[i]] = false;
        }
        delete recordedList;
        hadirCount = 0;
        alphaCount = 0;
        izinCount = 0;
    }
}