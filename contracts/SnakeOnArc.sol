// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20ArcUSDC {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SnakeOnArc {
    IERC20ArcUSDC public immutable usdc;
    address public immutable owner;

    uint256 public constant ENTRY_FEE = 100_000; // 0.1 USDC using 6 decimals through Arc's ERC-20 USDC interface.
    uint256 public constant DAILY_BONUS = 10;
    uint256 public constant CHECK_IN_COOLDOWN = 24 hours;
    uint256 public constant MAX_LEADERBOARD = 20;

    struct Profile {
        uint256 bestScore;
        uint256 bonusPoints;
        uint256 totalSubmitted;
        uint256 lastCheckIn;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 bonusPoints;
        uint256 submittedAt;
    }

    mapping(address => Profile) public profiles;
    LeaderboardEntry[] private leaderboard;

    event GameStarted(address indexed player, uint256 paid, uint256 timestamp);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 bestScore, uint256 paid, uint256 timestamp);
    event DailyCheckIn(address indexed player, uint256 bonus, uint256 paid, uint256 timestamp);
    event FeesWithdrawn(address indexed to, uint256 amount);

    error NotOwner();
    error CooldownActive(uint256 nextClaimAt);
    error PaymentFailed();
    error InvalidRecipient();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address usdcAddress) {
        usdc = IERC20ArcUSDC(usdcAddress);
        owner = msg.sender;
    }

    function startGame() external {
        _collectFee(msg.sender);
        emit GameStarted(msg.sender, ENTRY_FEE, block.timestamp);
    }

    function submitScore(uint256 score) external {
        _collectFee(msg.sender);

        Profile storage profile = profiles[msg.sender];
        profile.totalSubmitted += 1;
        if (score > profile.bestScore) {
            profile.bestScore = score;
        }

        _upsertLeaderboard(msg.sender, profile.bestScore, profile.bonusPoints);
        emit ScoreSubmitted(msg.sender, score, profile.bestScore, ENTRY_FEE, block.timestamp);
    }

    function dailyCheckIn() external {
        Profile storage profile = profiles[msg.sender];
        uint256 nextClaimAt = profile.lastCheckIn + CHECK_IN_COOLDOWN;
        if (profile.lastCheckIn != 0 && block.timestamp < nextClaimAt) {
            revert CooldownActive(nextClaimAt);
        }

        _collectFee(msg.sender);
        profile.bonusPoints += DAILY_BONUS;
        profile.lastCheckIn = block.timestamp;

        _upsertLeaderboard(msg.sender, profile.bestScore, profile.bonusPoints);

        emit DailyCheckIn(msg.sender, DAILY_BONUS, ENTRY_FEE, block.timestamp);
    }

    function getTopScores() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    function withdrawFees(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        bool ok = usdc.transfer(to, amount);
        if (!ok) revert PaymentFailed();
        emit FeesWithdrawn(to, amount);
    }

    function contractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function _collectFee(address player) internal {
        bool ok = usdc.transferFrom(player, address(this), ENTRY_FEE);
        if (!ok) revert PaymentFailed();
    }

    function _upsertLeaderboard(address player, uint256 bestScore, uint256 bonusPoints) internal {
        uint256 finalScore = bestScore + bonusPoints;
        bool found = false;

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                leaderboard[i] = LeaderboardEntry({
                    player: player,
                    score: finalScore,
                    bonusPoints: bonusPoints,
                    submittedAt: block.timestamp
                });
                found = true;
                break;
            }
        }

        if (!found) {
            if (leaderboard.length < MAX_LEADERBOARD) {
                leaderboard.push(LeaderboardEntry({
                    player: player,
                    score: finalScore,
                    bonusPoints: bonusPoints,
                    submittedAt: block.timestamp
                }));
            } else {
                uint256 lastIndex = leaderboard.length - 1;
                _sortLeaderboard();
                if (finalScore <= leaderboard[lastIndex].score) {
                    return;
                }
                leaderboard[lastIndex] = LeaderboardEntry({
                    player: player,
                    score: finalScore,
                    bonusPoints: bonusPoints,
                    submittedAt: block.timestamp
                });
            }
        }

        _sortLeaderboard();
    }

    function _sortLeaderboard() internal {
        uint256 length = leaderboard.length;
        for (uint256 i = 1; i < length; i++) {
            LeaderboardEntry memory key = leaderboard[i];
            uint256 j = i;
            while (j > 0 && leaderboard[j - 1].score < key.score) {
                leaderboard[j] = leaderboard[j - 1];
                j--;
            }
            leaderboard[j] = key;
        }
    }
}
