// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleVoting {
    address public owner;
    uint public yesCount;
    uint public noCount;
    bool public votingOpen;

    mapping(address => bool) public hasVoted;

    constructor() {
        owner = msg.sender;
        votingOpen = false;
    }

    function openVoting() public {
        require(msg.sender == owner, "Only owner can do this");
        votingOpen = true;
    }

    function closeVoting() public {
        require(msg.sender == owner, "Only owner can do this");
        votingOpen = false;
    }

    function voteYes() public {
        require(votingOpen, "Voting is closed");
        require(!hasVoted[msg.sender], "You have already voted");
        hasVoted[msg.sender] = true;
        yesCount += 1;
    }

    function voteNo() public {
        require(votingOpen, "Voting is closed");
        require(!hasVoted[msg.sender], "You have already voted");
        hasVoted[msg.sender] = true;
        noCount += 1;
    }

    function totalVote() public view returns (uint yesCount_, uint noCount_) {
        return (yesCount, noCount);
    }

    function status_votingOpen() public view returns (string memory){
        if (votingOpen == true) {
            return ("Voting is open");
        } else { 
            return ("Voting is close");
        }
    }

    function resetVoting() public {
        require(msg.sender == owner, "Only owner can reset voting");
        yesCount = 0;
        noCount = 0;
    }
}