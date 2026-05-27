// scripts/interact.js
// Module 11 - Script Interaksi dengan Contract
// Jalankan SETELAH deploy: npx hardhat run scripts/interact.js --network localhost
//
// ⚠️ PENTING: Ganti CONTRACT_ADDRESS dengan address dari output deploy.js

const hre = require("hardhat");

// ← Ganti dengan address hasil deploy.js
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Helper print separator
function sep(label = "") {
  const line = "-".repeat(50);
  if (label) console.log(`\n${line}\n  ${label}\n${line}`);
  else console.log(line);
}

async function main() {
  console.log("=".repeat(55));
  console.log("  Interaksi dengan CourseReward Contract");
  console.log("=".repeat(55));

  // Ambil signers
  const [owner, student1, student2, student3] = await hre.ethers.getSigners();

  // Attach ke contract yang sudah dideploy
  const CourseReward = await hre.ethers.getContractFactory("CourseReward");
  const contract = CourseReward.attach(CONTRACT_ADDRESS);

  // ===========================
  // BACA STATE AWAL
  // ===========================
  sep("1. State Awal Contract");
  console.log(`Owner         : ${await contract.owner()}`);
  console.log(`Reward Amount : ${await contract.rewardAmount()} poin`);
  console.log(`Is Active     : ${await contract.isActive()}`);
  console.log(`Bronze Reward : ${await contract.bronzeReward()} poin`);
  console.log(`Silver Reward : ${await contract.silverReward()} poin`);
  console.log(`Gold Reward   : ${await contract.goldReward()} poin`);
  console.log(`Total Claimer : ${await contract.getClaimersCount()}`);

  // ===========================
  // OWNER: WHITELIST MAHASISWA
  // ===========================
  sep("2. Owner Whitelist Mahasiswa");

  console.log(`Menambahkan student1 ke whitelist (Bronze)...`);
  let tx = await contract.connect(owner).addToWhitelist(student1.address, 1);
  await tx.wait();
  console.log(`  ✓ Student1 (${student1.address.slice(0, 10)}...) → Bronze`);

  console.log(`Menambahkan student2 ke whitelist (Silver)...`);
  tx = await contract.connect(owner).addToWhitelist(student2.address, 2);
  await tx.wait();
  console.log(`  ✓ Student2 (${student2.address.slice(0, 10)}...) → Silver`);

  console.log(`Menambahkan student3 ke whitelist (Gold)...`);
  tx = await contract.connect(owner).addToWhitelist(student3.address, 3);
  await tx.wait();
  console.log(`  ✓ Student3 (${student3.address.slice(0, 10)}...) → Gold`);

  // ===========================
  // CEK INFO MAHASISWA
  // ===========================
  sep("3. Info Mahasiswa Sebelum Klaim");
  for (const [label, student] of [
    ["Student1", student1],
    ["Student2", student2],
    ["Student3", student3],
  ]) {
    const [hasClaimed, isWhitelisted, tier, reward] =
      await contract.getStudentInfo(student.address);
    const tierNames = { 1: "Bronze", 2: "Silver", 3: "Gold" };
    console.log(
      `${label}: whitelist=${isWhitelisted}, tier=${tierNames[tier]}, hasClaimed=${hasClaimed}, reward=${reward}`,
    );
  }

  // ===========================
  // MAHASISWA KLAIM REWARD
  // ===========================
  sep("4. Mahasiswa Klaim Reward");

  console.log("Student1 (Bronze) klaim reward...");
  tx = await contract.connect(student1).claimReward();
  let receipt = await tx.wait();
  console.log(`  ✓ TX Hash: ${receipt.hash.slice(0, 20)}...`);

  console.log("Student2 (Silver) klaim reward...");
  tx = await contract.connect(student2).claimReward();
  receipt = await tx.wait();
  console.log(`  ✓ TX Hash: ${receipt.hash.slice(0, 20)}...`);

  // Student3 belum klaim (sengaja)

  // ===========================
  // CEK STATE SETELAH KLAIM
  // ===========================
  sep("5. State Setelah Klaim");
  console.log(`Total Claimer  : ${await contract.getClaimersCount()}`);
  console.log(
    `Student1 reward: ${await contract.rewards(student1.address)} poin`,
  );
  console.log(
    `Student2 reward: ${await contract.rewards(student2.address)} poin`,
  );
  console.log(
    `Student3 reward: ${await contract.rewards(
      student3.address,
    )} poin (belum klaim)`,
  );

  // ===========================
  // OWNER UBAH REWARD AMOUNT
  // ===========================
  sep("6. Owner Mengubah Reward Amount");
  console.log(`Reward sebelum : ${await contract.rewardAmount()} poin`);
  tx = await contract.connect(owner).setRewardAmount(200);
  await tx.wait();
  console.log(`Reward sesudah : ${await contract.rewardAmount()} poin`);
  console.log(`Bronze baru    : ${await contract.bronzeReward()} poin`);
  console.log(`Silver baru    : ${await contract.silverReward()} poin`);
  console.log(`Gold baru      : ${await contract.goldReward()} poin`);

  // ===========================
  // STUDENT3 KLAIM DENGAN REWARD BARU
  // ===========================
  sep("7. Student3 (Gold) Klaim dengan Reward Baru");
  tx = await contract.connect(student3).claimReward();
  receipt = await tx.wait();
  console.log(`  ✓ TX Hash    : ${receipt.hash.slice(0, 20)}...`);
  console.log(
    `  Reward dapet : ${await contract.rewards(student3.address)} poin`,
  );

  // ===========================
  // DAFTAR SEMUA CLAIMER
  // ===========================
  sep("8. Daftar Semua Mahasiswa yang Sudah Klaim");
  const claimers = await contract.getAllClaimers();
  claimers.forEach((addr, i) => {
    console.log(`  [${i + 1}] ${addr}`);
  });

  console.log("\n" + "=".repeat(55));
  console.log("  Selesai! Semua interaksi berhasil.");
  console.log("=".repeat(55));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
