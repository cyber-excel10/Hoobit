// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// interfaces defination at top level
interface IPropertyVerification {
    function isPropertyVerified(uint256 propertyId) external view returns (bool);
    function getPropertyOwner(uint256 propertyId) external view returns (address);
    function getListingFee() external view returns (uint256);
}

/**
 * @title RentalReceipt
 * @notice Issues permanent NFT receipts as proof of rental agreements and rent payments
 * @dev Only authorized contracts (TrustLeaseEscrow) can mint receipts
 */
contract RentalReceipt is ERC721, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Receipt types
    enum ReceiptType {
        RentalAgreement, // initial rental agreement NFT
        RentPayment      // monthly rent payment proof NFT
    }

    // Receipt data structure
    struct Receipt {
        ReceiptType receiptType;
        address tenant;
        address landlord;
        uint256 propertyId;
        uint256 amount; // deposit or rent amount
        uint256 startDate;
        uint256 endDate;
        uint256 issuedDate;
        string metadataHash; // IPFS hash with full agreement or payment details
        uint256 linkedAgreementId; // for rent payments, links to original agreement
    }

    // State variables
    uint256 private _nextReceiptId;
    mapping(uint256 => Receipt) public receipts;
    mapping(address => uint256[]) public tenantReceipts;
    mapping(uint256 => uint256[]) public agreementRentReceipts; // tracks all rent payments per agreement

    // Events
    event ReceiptMinted(
        uint256 indexed receiptId,
        ReceiptType receiptType,
        address indexed tenant,
        address indexed landlord,
        uint256 propertyId,
        uint256 amount,
        uint256 agreementId // indexed for better filtering on rent proofs
    );

    constructor() ERC721("TrustLease Rental Receipt", "TLRR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _nextReceiptId = 1;
    }

    /**
     * @notice Grant minter role to escrow contract
     * @param escrowContract Address of TrustLeaseEscrow contract
     */
    function setMinter(address escrowContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(escrowContract != address(0), "Invalid escrow address");
        _grantRole(MINTER_ROLE, escrowContract);
    }

    /**
     * @notice Mint receipt NFT for completed rental agreement
     * @dev Only callable by authorized minter (escrow contract)
     */
    function mintReceipt(
        address tenant,
        address landlord,
        uint256 propertyId,
        uint256 depositAmount,
        uint256  /* rentAmount */,
        uint256 startDate,
        uint256 endDate,
        string memory metadataHash
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(tenant != address(0), "Invalid tenant address");
        require(landlord != address(0), "Invalid landlord address");
        require(depositAmount > 0, "Deposit must be greater than zero");
        require(endDate > startDate, "Invalid rental period");
        require(bytes(metadataHash).length > 0, "Metadata hash required");

        uint256 receiptId = _nextReceiptId++;

        receipts[receiptId] = Receipt({
            receiptType: ReceiptType.RentalAgreement,
            tenant: tenant,
            landlord: landlord,
            propertyId: propertyId,
            amount: depositAmount,
            startDate: startDate,
            endDate: endDate,
            issuedDate: block.timestamp,
            metadataHash: metadataHash,
            linkedAgreementId: receiptId 
        });

        tenantReceipts[tenant].push(receiptId);

        // Mint NFT to tenant
        _safeMint(tenant, receiptId);

        emit ReceiptMinted(
            receiptId,
            ReceiptType.RentalAgreement,
            tenant,
            landlord,
            propertyId,
            depositAmount,
            receiptId
        );

        return receiptId;
    }

    /**
     * @notice Mint rent payment proof NFT
     * @dev Called by escrow when tenant pays monthly rent
     */
    function mintRentPaymentProof(
        address tenant,
        address landlord,
        uint256 agreementId,
        uint256 rentAmount,
        uint256 paymentDate,
        uint256 periodStart,
        uint256 periodEnd,
        string memory metadataHash
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        require(tenant != address(0), "Invalid tenant address");
        require(landlord != address(0), "Invalid landlord address");
        require(rentAmount > 0, "Rent must be greater than zero");
        require(periodEnd > periodStart, "Invalid period");
        require(bytes(metadataHash).length > 0, "Metadata hash required");

        uint256 receiptId = _nextReceiptId++;

        receipts[receiptId] = Receipt({
            receiptType: ReceiptType.RentPayment,
            tenant: tenant,
            landlord: landlord,
            propertyId: 0, 
            amount: rentAmount,
            startDate: periodStart,
            endDate: periodEnd,
            issuedDate: paymentDate,
            metadataHash: metadataHash,
            linkedAgreementId: agreementId
        });

        tenantReceipts[tenant].push(receiptId);
        agreementRentReceipts[agreementId].push(receiptId);

        // Mint NFT to tenant as proof of payment
        _safeMint(tenant, receiptId);

        emit ReceiptMinted(
            receiptId,
            ReceiptType.RentPayment,
            tenant,
            landlord,
            0,
            rentAmount,
            agreementId
        );

        return receiptId;
    }

    /**
     * @notice Admin burns invalid receipt
     * @param receiptId ID to burn
     */
    function burnReceipt(uint256 receiptId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ownerOf(receiptId) != address(0), "Receipt does not exist");
        _burn(receiptId);
    }

    /**
     * @notice Get receipt details
     * @param receiptId The receipt ID
     */
    function getReceipt(uint256 receiptId) external view returns (
        ReceiptType receiptType,
        address tenant,
        address landlord,
        uint256 propertyId,
        uint256 amount,
        uint256 startDate,
        uint256 endDate,
        uint256 issuedDate,
        string memory metadataHash,
        uint256 linkedAgreementId
    ) {
        Receipt memory receipt = receipts[receiptId];
        return (
            receipt.receiptType,
            receipt.tenant,
            receipt.landlord,
            receipt.propertyId,
            receipt.amount,
            receipt.startDate,
            receipt.endDate,
            receipt.issuedDate,
            receipt.metadataHash,
            receipt.linkedAgreementId
        );
    }

    /**
     * @notice Get all receipts owned by a tenant
     * @param tenant The tenant address
     */
    function getTenantReceipts(address tenant) external view returns (uint256[] memory) {
        return tenantReceipts[tenant];
    }

    /**
     * @notice Get all rent payment receipts for an agreement
     * @param agreementId The agreement ID
     */
    function getAgreementRentReceipts(uint256 agreementId) external view returns (uint256[] memory) {
        return agreementRentReceipts[agreementId];
    }

    /**
     * @notice Override to prevent receipt transfers soulbound
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // allow minting (from = address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("Rental receipts are non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}