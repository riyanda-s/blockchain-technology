# Course Reward System — Smart Contract

## Deskripsi

Sistem reward berbasis smart contract untuk mahasiswa yang menyelesaikan kursus. Dosen (owner) dapat mengatur jumlah reward dan whitelist mahasiswa per tier (Bronze/Silver/Gold). Mahasiswa yang terdaftar dapat mengklaim reward satu kali sebelum deadline. Seluruh aktivitas tercatat transparan di blockchain lokal.

## Anggota Kelompok

- Riyanda Cavin Sinambela - 5025221100

## Fitur

- Owner (dosen) dapat mengatur jumlah reward kapan saja
- Sistem whitelist: hanya mahasiswa terdaftar yang dapat klaim
- Tiga tier reward: Bronze, Silver, dan Gold
- Setiap mahasiswa hanya bisa klaim reward satu kali
- Deadline klaim yang dapat diatur oleh owner
- Contract dapat diaktifkan/dinonaktifkan oleh owner
- Event logging untuk setiap aksi penting

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm
- MetaMask (browser extension)

### Installation

```bash
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

Untuk melihat coverage:

```bash
npx hardhat coverage
```

### Deploy (Local)

Buka **dua terminal** terpisah:

**Terminal 1** : jalankan local blockchain:

```bash
npx hardhat node
```

**Terminal 2** : deploy contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Salin contract address dari output, lalu update `CONTRACT_ADDRESS` di `scripts/interact.js`.

### Interaksi via Script

```bash
npx hardhat run scripts/interact.js --network localhost
```

### Interaksi via MetaMask + Remix

1. Tambahkan network di MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
2. Import akun dari output `npx hardhat node` (salin private key)
3. Buka [Remix IDE](https://remix.ethereum.org)
4. Environment: `Injected Provider - MetaMask`
5. Klik **At Address** → paste contract address

## Contract Address

```
[Isi setelah deploy — contoh: 0x5FbDB2315678afecb367f032d93F642f64180aa3]
```

## Screenshot

| #   | Screenshot                    | Keterangan                          |
| --- | ----------------------------- | ----------------------------------- |
| 1   | `screenshots/01-compile.png`  | `npx hardhat compile` berhasil      |
| 2   | `screenshots/02-test.png`     | `npx hardhat test` semua passing    |
| 3   | `screenshots/03-coverage.png` | Coverage >80%                       |
| 4   | `screenshots/04-deploy.png`   | Output contract address             |
| 5   | `screenshots/05-metamask.png` | MetaMask terhubung ke Hardhat Local |
| 6   | `screenshots/06-tx1.png`      | Transaksi pertama berhasil          |
| 7   | `screenshots/07-tx2.png`      | Transaksi kedua berhasil            |
| 8   | `screenshots/08-state.png`    | Perubahan state contract            |

---

## Struktur Contract

### State Variables

| Variable        | Tipe                        | Keterangan                        |
| --------------- | --------------------------- | --------------------------------- |
| `owner`         | `address`                   | Pemilik contract (dosen)          |
| `rewardAmount`  | `uint256`                   | Base reward amount                |
| `isActive`      | `bool`                      | Status aktif contract             |
| `claimDeadline` | `uint256`                   | Batas waktu klaim                 |
| `hasClaimed`    | `mapping(address=>bool)`    | Status klaim per mahasiswa        |
| `rewards`       | `mapping(address=>uint256)` | Reward yang diterima              |
| `whitelist`     | `mapping(address=>bool)`    | Daftar mahasiswa yang boleh klaim |
| `rewardTier`    | `mapping(address=>uint8)`   | Tier reward (1/2/3)               |

### Functions

| Function                         | Akses                | Keterangan                    |
| -------------------------------- | -------------------- | ----------------------------- |
| `claimReward()`                  | Publik (whitelisted) | Klaim reward (sekali)         |
| `setRewardAmount(uint256)`       | Owner                | Ubah base reward              |
| `addToWhitelist(address, uint8)` | Owner                | Tambah mahasiswa + tier       |
| `removeFromWhitelist(address)`   | Owner                | Hapus dari whitelist          |
| `setDeadline(uint256)`           | Owner                | Set deadline baru             |
| `setContractActive(bool)`        | Owner                | Aktifkan/nonaktifkan          |
| `setTierAmounts(uint256×3)`      | Owner                | Custom reward per tier        |
| `getStudentInfo(address)`        | View                 | Info lengkap mahasiswa        |
| `getAllClaimers()`               | View                 | Daftar semua yang sudah klaim |

### Events

| Event                                      | Trigger                    |
| ------------------------------------------ | -------------------------- |
| `RewardClaimed(student, amount, tier)`     | Mahasiswa klaim reward     |
| `RewardAmountChanged(old, new)`            | Owner ubah reward amount   |
| `StudentWhitelisted(student, tier)`        | Owner tambah ke whitelist  |
| `StudentRemovedFromWhitelist(student)`     | Owner hapus dari whitelist |
| `DeadlineUpdated(newDeadline)`             | Owner update deadline      |
| `ContractStatusChanged(status)`            | Contract aktif/nonaktif    |
| `TierAmountsUpdated(bronze, silver, gold)` | Tier amount diubah         |
