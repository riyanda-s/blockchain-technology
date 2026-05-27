// scripts/deploy.js
// Module 11 - Deployment Script
// Jalankan: npx hardhat run scripts/deploy.js --network localhost

const hre = require("hardhat");

async function main() {
  console.log("=".repeat(55));
  console.log("  Deploying CourseReward Contract");
  console.log("=".repeat(55));

  // Parameter deploy
  const INITIAL_REWARD   = 100;  // Base reward (bisa diubah)
  const DURATION_IN_DAYS = 30;   // Deadline klaim: 30 hari dari sekarang

  // Ambil deployer (akun pertama di local network)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\nDeployer address : ${deployer.address}`);
  console.log(`Network          : ${hre.network.name}`);

  // Deploy contract
  console.log("\nDeploying...");
  const CourseReward = await hre.ethers.getContractFactory("CourseReward");
  const courseReward = await CourseReward.deploy(INITIAL_REWARD, DURATION_IN_DAYS);

  // Tunggu konfirmasi
  await courseReward.waitForDeployment();

  // Ambil info contract
  const address      = await courseReward.getAddress();
  const owner        = await courseReward.owner();
  const reward       = await courseReward.rewardAmount();
  const deadline     = await courseReward.claimDeadline();
  const bronze       = await courseReward.bronzeReward();
  const silver       = await courseReward.silverReward();
  const gold         = await courseReward.goldReward();

  const deadlineDate = new Date(Number(deadline) * 1000).toLocaleString("id-ID");

  console.log("\n" + "=".repeat(55));
  console.log("  Deployment Berhasil!");
  console.log("=".repeat(55));
  console.log(`Contract Address  : ${address}`);
  console.log(`Owner             : ${owner}`);
  console.log(`Base Reward       : ${reward} poin`);
  console.log(`Claim Deadline    : ${deadlineDate}`);
  console.log(`Bronze Reward     : ${bronze} poin`);
  console.log(`Silver Reward     : ${silver} poin`);
  console.log(`Gold Reward       : ${gold} poin`);
  console.log("=".repeat(55));
  console.log("\n💡 Salin CONTRACT ADDRESS di atas untuk dipakai di interact.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
