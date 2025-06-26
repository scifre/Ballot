# Ballot: A Blockchain and Face Verification-Powered Voting System

This project is a secure, decentralized electronic voting system that combines **Siamese neural networks for facial verification** with **Ethereum blockchain** for transparent and tamper-proof vote recording. It is designed to address the limitations of traditional and electronic voting systems by enhancing trust, security, and accessibility.

---

## Features

- **Voter Authentication using Siamese Network**  
  Live facial verification using deep learning (contrastive loss) and the CASIA-WebFace dataset to prevent spoofing attacks.

- **Tamper-Proof Voting via Ethereum Blockchain**  
  Votes are recorded immutably using smart contracts deployed via the Hardhat framework.

- **Live Election Management**  
  Real-time vote tracking, start/stop controls for election phases, and automatic result aggregation via smart contracts.

---

## Tech Stack

| Layer        | Technology                |
|-------------|---------------------------|
| Frontend     | React.js                  |
| Backend      | Node.js + Express         |
| Authentication | Siamese Network (PyTorch) |
| Database     | PostgreSQL               |
| Blockchain   | Ethereum (Sepolia Testnet) |
| Framework    | Hardhat                   |

---

## Siamese Model Results

- **Accuracy:** 97.2%  
- **Precision:** 97.64%  
- **Recall:** 96.75%  
The model robustly verifies faces with high resistance to spoofing (photos/videos), enabling secure biometric authentication.

---

## System Architecture

### Voter

1. **Registration:**
   - Enter voter details
   - Capture live photo (eye-blink/motion detection)
   - Store facial embedding (encrypted) + hashed password

2. **Authentication & Voting:**
   - Enter Voter ID + Password
   - Live photo verification (Siamese comparison)
   - Vote cast recorded on Ethereum

### Admin

- Start/Stop elections
- View live vote count and final results
- Query blockchain for audit-ready vote data

---

## Blockchain Design

- Each vote is stored in a **block** with:
  - `Candidate ID`
  - `Election ID`
  - Hashed `Voter ID`
- Votes are counted by querying blocks based on Candidate ID.
- Smart contracts ensure **one vote per voter** and enforce all rules transparently.

---

## Dataset

- **CASIA-WebFace Dataset**  
  Used for facial embedding training and anti-spoofing. [View on Kaggle.](https://www.kaggle.com/datasets/cybersimar08/casia-face-dataset)  
  - ~400,000 training images, 40,000 validation samples
  - Real-world faces across 10,000+ identities

---

## Hardhat Sample Commands

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
