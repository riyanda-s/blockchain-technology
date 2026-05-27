const { expect }     = require("chai");
const { ethers }     = require("hardhat");
const { time }       = require("@nomicfoundation/hardhat-network-helpers");

// ============================================================
// TEST SUITE: CourseReward Contract
// Module 10 - Smart Contract Testing
// ============================================================

describe("CourseReward", function () {

  // -------- Variabel Shared --------
  let courseReward;
  let owner, student1, student2, student3, nonWhitelisted;

  const INITIAL_REWARD    = 100;
  const DURATION_IN_DAYS  = 30; // 30 hari deadline
  const ONE_DAY           = 24 * 60 * 60;

  // -------- Deploy ulang contract sebelum tiap test --------
  beforeEach(async function () {
    [owner, student1, student2, student3, nonWhitelisted] =
      await ethers.getSigners();

    const CourseReward = await ethers.getContractFactory("CourseReward");
    courseReward = await CourseReward.deploy(INITIAL_REWARD, DURATION_IN_DAYS);
  });

  // ============================================================
  // 1. DEPLOYMENT
  // ============================================================
  describe("Deployment", function () {

    it("should set the correct owner", async function () {
      expect(await courseReward.owner()).to.equal(owner.address);
    });

    it("should set the correct initial reward amount", async function () {
      expect(await courseReward.rewardAmount()).to.equal(INITIAL_REWARD);
    });

    it("should set contract as active by default", async function () {
      expect(await courseReward.isActive()).to.equal(true);
    });

    it("should set correct tier amounts based on initial reward", async function () {
      expect(await courseReward.bronzeReward()).to.equal(INITIAL_REWARD);
      expect(await courseReward.silverReward()).to.equal(INITIAL_REWARD * 2);
      expect(await courseReward.goldReward()).to.equal(INITIAL_REWARD * 3);
    });

    it("should set deadline in the future", async function () {
      const deadline    = await courseReward.claimDeadline();
      const blockTime   = await time.latest();
      expect(deadline).to.be.greaterThan(blockTime);
    });

    it("should revert if reward amount is 0", async function () {
      const CourseReward = await ethers.getContractFactory("CourseReward");
      await expect(
        CourseReward.deploy(0, DURATION_IN_DAYS)
      ).to.be.revertedWith("Reward amount must be greater than 0");
    });

    it("should revert if duration is 0", async function () {
      const CourseReward = await ethers.getContractFactory("CourseReward");
      await expect(
        CourseReward.deploy(INITIAL_REWARD, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  // ============================================================
  // 2. WHITELIST MANAGEMENT
  // ============================================================
  describe("Whitelist Management", function () {

    it("should allow owner to add student to whitelist with tier", async function () {
      await courseReward.addToWhitelist(student1.address, 1);
      expect(await courseReward.whitelist(student1.address)).to.equal(true);
      expect(await courseReward.rewardTier(student1.address)).to.equal(1);
    });

    it("should emit StudentWhitelisted event when adding", async function () {
      await expect(courseReward.addToWhitelist(student1.address, 2))
        .to.emit(courseReward, "StudentWhitelisted")
        .withArgs(student1.address, 2);
    });

    it("should allow owner to remove student from whitelist", async function () {
      await courseReward.addToWhitelist(student1.address, 1);
      await courseReward.removeFromWhitelist(student1.address);
      expect(await courseReward.whitelist(student1.address)).to.equal(false);
    });

    it("should emit StudentRemovedFromWhitelist event when removing", async function () {
      await courseReward.addToWhitelist(student1.address, 1);
      await expect(courseReward.removeFromWhitelist(student1.address))
        .to.emit(courseReward, "StudentRemovedFromWhitelist")
        .withArgs(student1.address);
    });

    it("should reject non-owner adding to whitelist", async function () {
      await expect(
        courseReward.connect(student1).addToWhitelist(student2.address, 1)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should reject invalid tier values", async function () {
      await expect(
        courseReward.addToWhitelist(student1.address, 0)
      ).to.be.revertedWith("Invalid tier: use 1=Bronze, 2=Silver, 3=Gold");

      await expect(
        courseReward.addToWhitelist(student1.address, 4)
      ).to.be.revertedWith("Invalid tier: use 1=Bronze, 2=Silver, 3=Gold");
    });

    it("should reject removing student that is not whitelisted", async function () {
      await expect(
        courseReward.removeFromWhitelist(student1.address)
      ).to.be.revertedWith("Student is not in whitelist");
    });

    it("should reject zero address in whitelist", async function () {
      await expect(
        courseReward.addToWhitelist(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Invalid student address");
    });
  });

  // ============================================================
  // 3. CLAIM REWARD (POSITIVE TEST)
  // ============================================================
  describe("Claim Reward - Success Cases", function () {

    beforeEach(async function () {
      // Whitelist beberapa mahasiswa dengan tier berbeda
      await courseReward.addToWhitelist(student1.address, 1); // Bronze
      await courseReward.addToWhitelist(student2.address, 2); // Silver
      await courseReward.addToWhitelist(student3.address, 3); // Gold
    });

    it("should allow Bronze student to claim correct reward", async function () {
      await courseReward.connect(student1).claimReward();
      expect(await courseReward.rewards(student1.address)).to.equal(INITIAL_REWARD);
    });

    it("should allow Silver student to claim correct reward", async function () {
      await courseReward.connect(student2).claimReward();
      expect(await courseReward.rewards(student2.address)).to.equal(INITIAL_REWARD * 2);
    });

    it("should allow Gold student to claim correct reward", async function () {
      await courseReward.connect(student3).claimReward();
      expect(await courseReward.rewards(student3.address)).to.equal(INITIAL_REWARD * 3);
    });

    it("should mark student as hasClaimed after claiming", async function () {
      await courseReward.connect(student1).claimReward();
      expect(await courseReward.hasClaimed(student1.address)).to.equal(true);
    });

    it("should add student to claimers list", async function () {
      await courseReward.connect(student1).claimReward();
      expect(await courseReward.getClaimersCount()).to.equal(1);
      const claimers = await courseReward.getAllClaimers();
      expect(claimers[0]).to.equal(student1.address);
    });

    it("should allow multiple different students to claim", async function () {
      await courseReward.connect(student1).claimReward();
      await courseReward.connect(student2).claimReward();
      await courseReward.connect(student3).claimReward();

      expect(await courseReward.getClaimersCount()).to.equal(3);
      expect(await courseReward.rewards(student1.address)).to.equal(INITIAL_REWARD);
      expect(await courseReward.rewards(student2.address)).to.equal(INITIAL_REWARD * 2);
      expect(await courseReward.rewards(student3.address)).to.equal(INITIAL_REWARD * 3);
    });

    it("should emit RewardClaimed event with correct args", async function () {
      await expect(courseReward.connect(student1).claimReward())
        .to.emit(courseReward, "RewardClaimed")
        .withArgs(student1.address, INITIAL_REWARD, 1);
    });
  });

  // ============================================================
  // 4. CLAIM REWARD (NEGATIVE TEST)
  // ============================================================
  describe("Claim Reward - Failure Cases", function () {

    beforeEach(async function () {
      await courseReward.addToWhitelist(student1.address, 1);
    });

    it("should not allow student to claim twice", async function () {
      await courseReward.connect(student1).claimReward();

      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("Reward already claimed");
    });

    it("should not allow non-whitelisted student to claim", async function () {
      await expect(
        courseReward.connect(nonWhitelisted).claimReward()
      ).to.be.revertedWith("You are not whitelisted");
    });

    it("should not allow claim when contract is inactive", async function () {
      await courseReward.setContractActive(false);

      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("Contract is not active");
    });

    it("should not allow claim after deadline has passed", async function () {
      // Lompat waktu ke 31 hari ke depan (melewati deadline 30 hari)
      await time.increase(ONE_DAY * 31);

      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("Claim deadline has passed");
    });

    it("should not allow claim after being removed from whitelist", async function () {
      await courseReward.removeFromWhitelist(student1.address);

      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("You are not whitelisted");
    });
  });

  // ============================================================
  // 5. ACCESS CONTROL
  // ============================================================
  describe("Access Control", function () {

    it("should allow owner to change reward amount", async function () {
      await courseReward.setRewardAmount(200);
      expect(await courseReward.rewardAmount()).to.equal(200);
    });

    it("should reject non-owner changing reward amount", async function () {
      await expect(
        courseReward.connect(student1).setRewardAmount(200)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should allow owner to activate/deactivate contract", async function () {
      await courseReward.setContractActive(false);
      expect(await courseReward.isActive()).to.equal(false);

      await courseReward.setContractActive(true);
      expect(await courseReward.isActive()).to.equal(true);
    });

    it("should reject non-owner changing contract status", async function () {
      await expect(
        courseReward.connect(student1).setContractActive(false)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should allow owner to update deadline", async function () {
      const before = await courseReward.claimDeadline();
      await courseReward.setDeadline(60); // extend 60 hari
      const after = await courseReward.claimDeadline();
      expect(after).to.be.greaterThan(before);
    });

    it("should reject non-owner updating deadline", async function () {
      await expect(
        courseReward.connect(student1).setDeadline(60)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should allow owner to set custom tier amounts", async function () {
      await courseReward.setTierAmounts(50, 150, 300);
      expect(await courseReward.bronzeReward()).to.equal(50);
      expect(await courseReward.silverReward()).to.equal(150);
      expect(await courseReward.goldReward()).to.equal(300);
    });

    it("should reject invalid tier amounts", async function () {
      // Silver <= Bronze → tidak valid
      await expect(
        courseReward.setTierAmounts(100, 100, 300)
      ).to.be.revertedWith("Silver must be > Bronze");

      // Gold <= Silver → tidak valid
      await expect(
        courseReward.setTierAmounts(100, 200, 200)
      ).to.be.revertedWith("Gold must be > Silver");
    });
  });

  // ============================================================
  // 6. EVENTS
  // ============================================================
  describe("Events", function () {

    it("should emit RewardAmountChanged event", async function () {
      await expect(courseReward.setRewardAmount(200))
        .to.emit(courseReward, "RewardAmountChanged")
        .withArgs(INITIAL_REWARD, 200);
    });

    it("should emit ContractStatusChanged event", async function () {
      await expect(courseReward.setContractActive(false))
        .to.emit(courseReward, "ContractStatusChanged")
        .withArgs(false);
    });

    it("should emit DeadlineUpdated event", async function () {
      await expect(courseReward.setDeadline(60))
        .to.emit(courseReward, "DeadlineUpdated");
    });

    it("should emit TierAmountsUpdated event", async function () {
      await expect(courseReward.setTierAmounts(50, 150, 300))
        .to.emit(courseReward, "TierAmountsUpdated")
        .withArgs(50, 150, 300);
    });
  });

  // ============================================================
  // 7. VIEW FUNCTIONS
  // ============================================================
  describe("View Functions", function () {

    it("should return correct student info before claim", async function () {
      await courseReward.addToWhitelist(student1.address, 2);
      const [hasClaimed, isWhitelisted, tier, rewardClaimed] =
        await courseReward.getStudentInfo(student1.address);

      expect(hasClaimed).to.equal(false);
      expect(isWhitelisted).to.equal(true);
      expect(tier).to.equal(2);
      expect(rewardClaimed).to.equal(0);
    });

    it("should return correct student info after claim", async function () {
      await courseReward.addToWhitelist(student1.address, 2);
      await courseReward.connect(student1).claimReward();

      const [hasClaimed, isWhitelisted, tier, rewardClaimed] =
        await courseReward.getStudentInfo(student1.address);

      expect(hasClaimed).to.equal(true);
      expect(rewardClaimed).to.equal(INITIAL_REWARD * 2);
    });

    it("should return false for isDeadlinePassed before deadline", async function () {
      expect(await courseReward.isDeadlinePassed()).to.equal(false);
    });

    it("should return true for isDeadlinePassed after deadline", async function () {
      await time.increase(ONE_DAY * 31);
      expect(await courseReward.isDeadlinePassed()).to.equal(true);
    });

    it("should return correct tier reward amounts", async function () {
      expect(await courseReward.getTierRewardAmount(1)).to.equal(INITIAL_REWARD);
      expect(await courseReward.getTierRewardAmount(2)).to.equal(INITIAL_REWARD * 2);
      expect(await courseReward.getTierRewardAmount(3)).to.equal(INITIAL_REWARD * 3);
    });
  });

  // ============================================================
  // 8. SKENARIO INTEGRASI (End-to-End)
  // ============================================================
  describe("Integration Scenarios", function () {

    it("Scenario: Owner sets up reward, whitelist students, students claim", async function () {
      // Step 1: Owner mengubah reward amount
      await courseReward.setRewardAmount(50);

      // Step 2: Owner whitelist mahasiswa
      await courseReward.addToWhitelist(student1.address, 1); // Bronze = 50
      await courseReward.addToWhitelist(student2.address, 3); // Gold   = 150

      // Step 3: Mahasiswa klaim
      await courseReward.connect(student1).claimReward();
      await courseReward.connect(student2).claimReward();

      // Verifikasi
      expect(await courseReward.rewards(student1.address)).to.equal(50);
      expect(await courseReward.rewards(student2.address)).to.equal(150);
      expect(await courseReward.getClaimersCount()).to.equal(2);
    });

    it("Scenario: Owner pauses and resumes contract", async function () {
      await courseReward.addToWhitelist(student1.address, 1);

      // Pause contract
      await courseReward.setContractActive(false);
      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("Contract is not active");

      // Resume contract
      await courseReward.setContractActive(true);
      await courseReward.connect(student1).claimReward();
      expect(await courseReward.hasClaimed(student1.address)).to.equal(true);
    });

    it("Scenario: Extend deadline allows late claim", async function () {
      await courseReward.addToWhitelist(student1.address, 1);

      // Lompat ke hari ke-31 (deadline terlampaui)
      await time.increase(ONE_DAY * 31);
      await expect(
        courseReward.connect(student1).claimReward()
      ).to.be.revertedWith("Claim deadline has passed");

      // Owner extend deadline 10 hari lagi
      await courseReward.setDeadline(10);
      await courseReward.connect(student1).claimReward();
      expect(await courseReward.hasClaimed(student1.address)).to.equal(true);
    });
  });
});
