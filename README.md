# 🏠 TrustLease — Scam-Proof Blockchain Rental Platform  
Built on **Flow EVM Testnet**

TrustLease is a transparent, blockchain-powered rental system that protects tenants and landlords from scams using **on-chain verification**, **escrow deposits**, and **NFT rent receipts**.

This project demonstrates how Web3 can make real-life rental systems safer, transparent, and fully protected from manipulation.

---

## 🚀 Why TrustLease?
Traditional rental platforms allow:
- Fake landlords  
- Edited / deleted property information  
- Stolen security deposits  
- Unverifiable receipts  

TrustLease eliminates these problems with blockchain transparency.

---

# 🔑 Core Ideas (Beginner-Friendly)
### **🧱 Blockchain**
A public database that nobody can secretly change.

### **🔐 Smart Contract**
Code that acts like a digital “lawyer” — it enforces the rules automatically.

### **👛 Web3 Wallet**
Your secure identity — like a banking app that approves actions without passwords.

### **🧾 NFT Receipt**
A permanent, tamper-proof digital proof of rent payment.

### **📦 IPFS**
A decentralized storage system like Google Drive,  
**but nobody can delete or edit the files**.  
Used for property images, documents, etc.

---

# ⚙️ Features

## ✅ **Fully Working (Live Demo Ready)**
### **1. List Property (Frontend + Contract)**
- Landlord can upload property details  
- Stored permanently on-chain  
- Cannot be edited or faked  

### **2. Verify Property (Admin)**
- Prevents scams  
- Verification is controlled — but transparent  
- For demo purposes, verification is done via **Remix**  
- In production: would be replaced with an admin dashboard

---

## 🏗️ **Implemented in Smart Contract (UI Coming Soon)**

### **3. Create Rental Agreement**
- Tenant starts agreement  
- Creates a secure link between tenant & landlord  

### **4. Pay Security Deposit**
- FLOW deposit locked in **escrow**  
- Nobody can touch the funds (not owner, not devs)  
- Released automatically based on rules  

### **5. Double Confirmation System**
- Landlord & tenant must both confirm move-in  
- Stops fake tenants / fake landlords  

### **6. Pay Rent + NFT Receipts**
- Rent payments mint unforgeable receipt NFTs  
- Permanent history of payments  

### **7. IPFS Integration (Not Yet Connected)**
- For storing property images & documents  
- Ensures files cannot be changed or removed  

---

# 🖥️ Tech Stack

### **Frontend**
- React / Next.js  
- Wagmi + WalletConnect (or Metamask)  
- Ethers.js  
- TailwindCSS  
- Flow EVM Testnet RPC  

### **Smart Contract**
- Solidity (`^0.8.28`)  
- Flow EVM Testnet  
- Remix

## 🔗 Smart Contracts (Flow EVM Testnet)

- **PropertyVerification:**  
  `https://evm-testnet.flowscan.io/address/0x1d81c1F05926719bF8acBDeF8c222C017Aabb227`

- **TrustLeaseEscrow:**  
  `https://evm-testnet.flowscan.io/address/0xD11098885107e58F6E5311dC4A6E924739AeE5C7`

- **RentalReceipt (NFT):**  
  `https://evm-testnet.flowscan.io/address/0xa22f7A8539004b5850CC5810E0F04f32F63F100B`

All contracts are deployed and verifiable on Flow EVM Testnet.



---

# 🔧 How to Run Locally

## 1️⃣ Clone the repository  
git clone (https://github.com/cyber-excel10/Hoobit)

# 🧠 How It Works (Clear Explanation)

### **1. Property Listing**
Landlord submits details → contract saves data permanently → anyone can verify authenticity.

### **2. Property Verification**
Platform verifies property → prevents scammers from adding fake listings.

### **3. Agreement + Escrow**
Tenant creates agreement → deposit locked → blockchain holds the money.

### **4. Move-in Confirmation**
Both sides confirm → contract activates.

### **5. Rent Payment**
Tenant pays rent → smart contract mints an NFT receipt.

### **6. Permanent History**
All actions are visible forever, providing:
- Transparency  
- Proof  
- Trust  

---

# 🎯 Vision
TrustLease aims to become the safest rental system in Africa —  
where no one can lose money to fake landlords ever again.

Blockchain + escrow + transparency = **zero scam rentals**.

---

# 🤝 Contributors
- **Joseph (Lead Developer, Smart Contracts & Frontend)**  
- AI-assisted development (due to frontend teammate unavailability)

---

# 🏁 License
MIT License — free for learning and improvement.

---

## 📄 Project Documentation

- **Ideathon PDF (Problem, Solution, MVP, Ethics, References):**
https://docs.google.com/document/d/1ty7gOb2uLMPzKGmKJMqdwJeG4cHodNEp2LhRrRn_rKs/edit?usp=sharing


# 🙏 Acknowledgements
Thanks to:
- Flow Blockchain Team.
- Open-source libraries that powered this project  






