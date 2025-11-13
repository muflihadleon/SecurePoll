// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./Poll.sol";

/// @title Poll Factory Contract
/// @notice Factory contract for creating and managing poll contracts
contract PollFactory {
    address[] public allPolls;
    mapping(address => address[]) public pollsByOwner;

    event PollCreated(
        address indexed poll,
        address indexed owner,
        string name,
        uint256 endTime
    );

    /// @notice Create a new poll
    /// @param _name Poll name
    /// @param _details Poll details
    /// @param _endTime Poll end time timestamp
    /// @param _optionCount Number of options in the poll
    /// @return pollAddress The address of the newly created poll
    function createPoll(
        string memory _name,
        string memory _details,
        uint256 _endTime,
        uint8 _optionCount
    ) external returns (address pollAddress) {
        Poll newPoll = new Poll(
            msg.sender,
            _name,
            _details,
            _endTime,
            _optionCount
        );

        pollAddress = address(newPoll);
        allPolls.push(pollAddress);
        pollsByOwner[msg.sender].push(pollAddress);

        emit PollCreated(pollAddress, msg.sender, _name, _endTime);
    }

    /// @notice Get all poll addresses
    /// @return Array of all poll addresses
    function getAllPolls() external view returns (address[] memory) {
        return allPolls;
    }

    /// @notice Get polls created by a specific address
    /// @param _owner The owner's address
    /// @return Array of poll addresses created by the owner
    function getPollsByOwner(address _owner)
        external
        view
        returns (address[] memory)
    {
        return pollsByOwner[_owner];
    }

    /// @notice Get total number of polls
    /// @return Total count of polls
    function getPollCount() external view returns (uint256) {
        return allPolls.length;
    }
}




