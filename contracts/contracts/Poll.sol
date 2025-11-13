// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint8, euint16, euint32, externalEuint8, externalEuint16, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecurePoll Contract
/// @notice A fully homomorphic encrypted polling contract that stores encrypted votes
/// @dev All votes are encrypted using FHEVM, only aggregate results can be decrypted by authorized parties
contract Poll is ZamaEthereumConfig {
    /// @notice Poll metadata
    struct PollMetadata {
        address owner;
        string name;
        string details;
        uint256 endTime;
        uint256 startTime;
        bool isOpen;
    }

    /// @notice Encrypted vote structure
    struct EncryptedVote {
        address voter;
        externalEuint8[] votes; // Array of encrypted votes (euint8 for Likert scale 1-5)
        bytes[] inputProofs; // Array of proofs for each vote
        uint256 timestamp;
        bool isProcessed;
    }

    /// @notice Aggregated statistics (encrypted)
    struct AggregatedData {
        euint32 totalVotes; // Total number of votes
        euint32[] optionSums; // Sum of votes per option (for average calculation)
        euint32[] optionCounts; // Count of non-zero votes per option
        bool isDecrypted;
        uint256 lastUpdated;
    }

    PollMetadata public info;
    uint256 public voteCount;
    mapping(uint256 => EncryptedVote) public votes;
    AggregatedData public aggregatedData;
    
    // Track which options exist (for aggregation)
    uint8 public optionCount;

    event PollCreated(
        address indexed poll,
        address indexed owner,
        string name,
        uint256 endTime
    );

    event VoteSubmitted(
        uint256 indexed voteId,
        address indexed voter,
        uint256 timestamp
    );

    event AggregationRequested(
        uint256 indexed requestId,
        uint256 timestamp
    );

    event AggregationCompleted(
        uint256 indexed requestId,
        bytes aggregateCipher,
        uint256 timestamp
    );

    event DecryptionAuthorized(
        address indexed who,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == info.owner, "Only owner can call this");
        _;
    }

    modifier pollOpen() {
        require(info.isOpen, "Poll is not open");
        require(block.timestamp <= info.endTime, "Poll deadline passed");
        _;
    }

    constructor(
        address _owner,
        string memory _name,
        string memory _details,
        uint256 _endTime,
        uint8 _optionCount
    ) {
        require(_owner != address(0), "Invalid owner address");
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_optionCount > 0 && _optionCount <= 50, "Invalid option count");

        info = PollMetadata({
            owner: _owner,
            name: _name,
            details: _details,
            endTime: _endTime,
            startTime: block.timestamp,
            isOpen: true
        });

        optionCount = _optionCount;
        
        // Initialize aggregated data
        aggregatedData.totalVotes = FHE.asEuint32(0);
        aggregatedData.isDecrypted = false;
        aggregatedData.lastUpdated = 0;

        emit PollCreated(address(this), _owner, _name, _endTime);
    }

    /// @notice Submit encrypted votes to the poll
    /// @param _votes Array of encrypted votes (externalEuint8)
    /// @param _inputProofs Array of zero-knowledge proofs for each vote
    function submitEncryptedVote(
        externalEuint8[] calldata _votes,
        bytes[] calldata _inputProofs
    ) external pollOpen {
        require(_votes.length == optionCount, "Vote count mismatch");
        require(_votes.length == _inputProofs.length, "Proof count mismatch");
        require(voteCount < type(uint256).max, "Too many votes");

        // Convert external encrypted values to internal encrypted values
        euint8[] memory internalVotes = new euint8[](_votes.length);
        
        for (uint256 i = 0; i < _votes.length; i++) {
            // Verify proof and convert external to internal
            internalVotes[i] = FHE.fromExternal(_votes[i], _inputProofs[i]);
            
            // Verify vote is in valid range (1-5 for Likert scale)
            // Using FHE comparison operations
            euint8 one = FHE.asEuint8(1);
            euint8 five = FHE.asEuint8(5);
            
            // Note: In production, you might want to add range checks
            // This is simplified - in real implementation, you'd use FHE comparison
            // and potentially revert if out of range
        }

        // Store vote metadata
        votes[voteCount] = EncryptedVote({
            voter: msg.sender,
            votes: _votes, // Store external encrypted values
            inputProofs: _inputProofs,
            timestamp: block.timestamp,
            isProcessed: false
        });

        emit VoteSubmitted(voteCount, msg.sender, block.timestamp);
        voteCount++;
    }

    /// @notice Request aggregation of all votes
    /// @dev This emits an event that coprocessors listen to
    function requestAggregation() external onlyOwner returns (uint256) {
        require(voteCount > 0, "No votes to aggregate");
        
        uint256 requestId = block.number * 1000 + block.timestamp % 1000;
        
        emit AggregationRequested(requestId, block.timestamp);
        
        return requestId;
    }


    function commitAggregationResult(
        uint256 _requestId,
        externalEuint32 _totalVotes,
        externalEuint32[] calldata _optionSums,
        externalEuint32[] calldata _optionCounts,
        bytes calldata _totalProof,
        bytes[] calldata _sumsProofs,
        bytes[] calldata _countsProofs
    ) external {
        require(_optionSums.length == optionCount, "Invalid sums length");
        require(_optionCounts.length == optionCount, "Invalid counts length");
        require(_sumsProofs.length == optionCount, "Invalid sums proofs length");
        require(_countsProofs.length == optionCount, "Invalid counts proofs length");

        // Convert external encrypted values to internal
        euint32 total = FHE.fromExternal(_totalVotes, _totalProof);
        
        euint32[] memory sums = new euint32[](_optionSums.length);
        euint32[] memory counts = new euint32[](_optionCounts.length);
        
        for (uint256 i = 0; i < _optionSums.length; i++) {
            sums[i] = FHE.fromExternal(_optionSums[i], _sumsProofs[i]);
            counts[i] = FHE.fromExternal(_optionCounts[i], _countsProofs[i]);
        }

        // Update aggregated data
        aggregatedData.totalVotes = total;
        aggregatedData.optionSums = sums;
        aggregatedData.optionCounts = counts;
        aggregatedData.lastUpdated = block.timestamp;

        // Allow owner to decrypt these values
        FHE.allowThis(aggregatedData.totalVotes);
        FHE.allow(aggregatedData.totalVotes, info.owner);
        
        for (uint256 i = 0; i < sums.length; i++) {
            FHE.allowThis(sums[i]);
            FHE.allow(sums[i], info.owner);
            FHE.allowThis(counts[i]);
            FHE.allow(counts[i], info.owner);
        }

        emit AggregationCompleted(_requestId, "", block.timestamp);
        emit DecryptionAuthorized(info.owner, block.timestamp);
    }

    /// @notice Get encrypted aggregated statistics
    /// @return total Total encrypted vote count
    /// @return sums Encrypted sums per option
    /// @return counts Encrypted counts per option
    function getAggregatedData()
        external
        view
        returns (
            euint32 total,
            euint32[] memory sums,
            euint32[] memory counts
        )
    {
        return (
            aggregatedData.totalVotes,
            aggregatedData.optionSums,
            aggregatedData.optionCounts
        );
    }

    /// @notice Get vote count (public information)
    function getVoteCount() external view returns (uint256) {
        return voteCount;
    }

    /// @notice Get poll metadata
    function getInfo()
        external
        view
        returns (
            address owner,
            string memory name,
            string memory details,
            uint256 endTime,
            uint256 startTime,
            bool isOpen
        )
    {
        return (
            info.owner,
            info.name,
            info.details,
            info.endTime,
            info.startTime,
            info.isOpen
        );
    }

    /// @notice Close the poll (owner only)
    function closePoll() external onlyOwner {
        info.isOpen = false;
    }
}




