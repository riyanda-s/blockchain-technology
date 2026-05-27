// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CourseReward
 * @author Project 2 - Smart Contract Development
 * @notice Sistem reward untuk mahasiswa yang menyelesaikan kursus
 * @dev Deploy dengan initial reward amount dan durasi deadline (dalam hari)
 */
contract CourseReward {

    // =====================
    // STATE VARIABLES
    // =====================

    address public owner;           // Pemilik contract (dosen)
    uint256 public rewardAmount;    // Base reward amount
    bool public isActive;           // Status contract (aktif/tidak)
    uint256 public claimDeadline;   // Timestamp batas waktu klaim

    // Reward tier amounts
    uint256 public bronzeReward;    // Tier 1: reward bronze
    uint256 public silverReward;    // Tier 2: reward silver
    uint256 public goldReward;      // Tier 3: reward gold

    // =====================
    // MAPPINGS
    // =====================

    /// @notice Tracking apakah mahasiswa sudah claim reward
    mapping(address => bool) public hasClaimed;

    /// @notice Jumlah reward yang sudah diklaim mahasiswa
    mapping(address => uint256) public rewards;

    /// @notice Whitelist mahasiswa yang boleh klaim
    mapping(address => bool) public whitelist;

    /// @notice Tier reward tiap mahasiswa (1=Bronze, 2=Silver, 3=Gold)
    mapping(address => uint8) public rewardTier;

    // =====================
    // ARRAYS (untuk tracking)
    // =====================

    /// @notice Daftar semua alamat mahasiswa yang sudah klaim
    address[] public claimers;

    // =====================
    // EVENTS
    // =====================

    event RewardClaimed(address indexed student, uint256 amount, uint8 tier);
    event RewardAmountChanged(uint256 oldAmount, uint256 newAmount);
    event StudentWhitelisted(address indexed student, uint8 tier);
    event StudentRemovedFromWhitelist(address indexed student);
    event DeadlineUpdated(uint256 newDeadline);
    event ContractStatusChanged(bool newStatus);
    event TierAmountsUpdated(uint256 bronze, uint256 silver, uint256 gold);

    // =====================
    // MODIFIERS
    // =====================

    /// @dev Hanya owner (dosen) yang bisa memanggil function ini
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /// @dev Contract harus dalam keadaan aktif
    modifier whenActive() {
        require(isActive, "Contract is not active");
        _;
    }

    /// @dev Klaim harus sebelum deadline
    modifier beforeDeadline() {
        require(block.timestamp <= claimDeadline, "Claim deadline has passed");
        _;
    }

    /// @dev Pemanggil harus terdaftar di whitelist
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "You are not whitelisted");
        _;
    }

    // =====================
    // CONSTRUCTOR
    // =====================

    /**
     * @notice Inisialisasi contract saat deploy
     * @param _rewardAmount Base reward amount (satuan token/poin)
     * @param _durationInDays Durasi klaim dalam hari dari sekarang
     */
    constructor(uint256 _rewardAmount, uint256 _durationInDays) {
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

        owner         = msg.sender;
        rewardAmount  = _rewardAmount;
        isActive      = true;
        claimDeadline = block.timestamp + (_durationInDays * 1 days);

        // Set default tier amounts
        bronzeReward = _rewardAmount;
        silverReward = _rewardAmount * 2;
        goldReward   = _rewardAmount * 3;
    }

    // =====================
    // CORE FUNCTION: CLAIM
    // =====================

    /**
     * @notice Mahasiswa klaim reward mereka (hanya sekali)
     * @dev Memanggil function ini membutuhkan: aktif, sebelum deadline,
     *      ada di whitelist, dan belum pernah klaim
     */
    function claimReward() public whenActive beforeDeadline onlyWhitelisted {
        require(!hasClaimed[msg.sender], "Reward already claimed");

        uint8  tier   = rewardTier[msg.sender];
        uint256 amount = _getTierAmount(tier);

        hasClaimed[msg.sender]  = true;
        rewards[msg.sender]     = amount;
        claimers.push(msg.sender);

        emit RewardClaimed(msg.sender, amount, tier);
    }

    // =====================
    // OWNER FUNCTIONS
    // =====================

    /**
     * @notice Owner mengubah base reward amount dan reset semua tier
     * @param _newAmount Nilai reward baru
     */
    function setRewardAmount(uint256 _newAmount) public onlyOwner {
        require(_newAmount > 0, "Reward amount must be greater than 0");
        uint256 oldAmount = rewardAmount;
        rewardAmount  = _newAmount;
        bronzeReward  = _newAmount;
        silverReward  = _newAmount * 2;
        goldReward    = _newAmount * 3;
        emit RewardAmountChanged(oldAmount, _newAmount);
    }

    /**
     * @notice Owner menambahkan mahasiswa ke whitelist dengan tier tertentu
     * @param _student Alamat wallet mahasiswa
     * @param _tier Tier reward: 1=Bronze, 2=Silver, 3=Gold
     */
    function addToWhitelist(address _student, uint8 _tier) public onlyOwner {
        require(_student != address(0), "Invalid student address");
        require(_tier >= 1 && _tier <= 3, "Invalid tier: use 1=Bronze, 2=Silver, 3=Gold");
        whitelist[_student]    = true;
        rewardTier[_student]   = _tier;
        emit StudentWhitelisted(_student, _tier);
    }

    /**
     * @notice Owner menghapus mahasiswa dari whitelist
     * @param _student Alamat wallet mahasiswa
     */
    function removeFromWhitelist(address _student) public onlyOwner {
        require(whitelist[_student], "Student is not in whitelist");
        whitelist[_student] = false;
        emit StudentRemovedFromWhitelist(_student);
    }

    /**
     * @notice Owner mengubah deadline klaim
     * @param _durationInDays Durasi baru dari sekarang (dalam hari)
     */
    function setDeadline(uint256 _durationInDays) public onlyOwner {
        require(_durationInDays > 0, "Duration must be greater than 0");
        claimDeadline = block.timestamp + (_durationInDays * 1 days);
        emit DeadlineUpdated(claimDeadline);
    }

    /**
     * @notice Owner mengaktifkan atau menonaktifkan contract
     * @param _isActive Status baru contract
     */
    function setContractActive(bool _isActive) public onlyOwner {
        isActive = _isActive;
        emit ContractStatusChanged(_isActive);
    }

    /**
     * @notice Owner mengatur jumlah reward per tier secara manual
     * @param _bronze Jumlah reward tier Bronze
     * @param _silver Jumlah reward tier Silver
     * @param _gold   Jumlah reward tier Gold
     */
    function setTierAmounts(
        uint256 _bronze,
        uint256 _silver,
        uint256 _gold
    ) public onlyOwner {
        require(_bronze > 0, "Bronze reward must be > 0");
        require(_silver > _bronze, "Silver must be > Bronze");
        require(_gold > _silver, "Gold must be > Silver");
        bronzeReward = _bronze;
        silverReward = _silver;
        goldReward   = _gold;
        emit TierAmountsUpdated(_bronze, _silver, _gold);
    }

    // =====================
    // VIEW FUNCTIONS
    // =====================

    /**
     * @notice Mengembalikan jumlah mahasiswa yang sudah klaim reward
     */
    function getClaimersCount() public view returns (uint256) {
        return claimers.length;
    }

    /**
     * @notice Mengembalikan daftar semua mahasiswa yang sudah klaim
     */
    function getAllClaimers() public view returns (address[] memory) {
        return claimers;
    }

    /**
     * @notice Mengembalikan informasi lengkap seorang mahasiswa
     * @param _student Alamat wallet mahasiswa
     */
    function getStudentInfo(address _student) public view returns (
        bool   _hasClaimed,
        bool   _isWhitelisted,
        uint8  _tier,
        uint256 _rewardClaimed
    ) {
        return (
            hasClaimed[_student],
            whitelist[_student],
            rewardTier[_student],
            rewards[_student]
        );
    }

    /**
     * @notice Mengecek apakah deadline sudah lewat
     */
    function isDeadlinePassed() public view returns (bool) {
        return block.timestamp > claimDeadline;
    }

    /**
     * @notice Mengembalikan reward amount berdasarkan tier
     * @param _tier Tier reward: 1=Bronze, 2=Silver, 3=Gold
     */
    function getTierRewardAmount(uint8 _tier) public view returns (uint256) {
        return _getTierAmount(_tier);
    }

    // =====================
    // INTERNAL FUNCTIONS
    // =====================

    /**
     * @dev Menentukan jumlah reward berdasarkan tier
     */
    function _getTierAmount(uint8 tier) internal view returns (uint256) {
        if (tier == 3) return goldReward;
        if (tier == 2) return silverReward;
        return bronzeReward; // tier == 1 (default)
    }
}
