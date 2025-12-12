# 🏠 TrustLease — Scam-Proof Blockchain Rental Platform  
Built on **Flow EVM Testnet**

TrustLease is a transparent, blockchain-powered rental system that protects tenants and landlords from scams using **on-chain verification**, **escrow deposits**, and **NFT rent receipts**.

This project was built for hackathon purposes to demonstrate how Web3 can make real-life rental systems safer, more trustworthy, and impossible to manipulate.

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
- Solidity (`^0.8.x`)  
- Flow EVM Testnet  
- Hardhat / Remix  

---

# 📁 Project Structure

