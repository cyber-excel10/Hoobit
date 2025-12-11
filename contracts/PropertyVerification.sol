// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
/**
 * @title PropertyVerification
 * @notice Manages landlord verification and mints property badge NFTs with listing fees
 * @dev Each verified property gets a unique NFT that acts as a trust badge
 */
contract PropertyVerification is ERC721, Ownable, ReentrancyGuard {
   
    // Property data structure with enhanced KYC details
    struct Property {
        address owner;
        string propertyAddress;
        string documentHash; // IPFS hash for KYC docs (ID, property deed, tax receipts)
        string videoHash; // IPFS hash for video walkthrough with GPS metadata
        string gpsCoordinates;
        uint256 verificationDate;
        bool isVerified;
        bool isActive;
        uint256 kycLevel; // 1=Basic, 2=Enhanced (government ID verified off-chain)
    }
    // off-chain verification tracking
    struct KYCProof {
        string personaVerificationId; // ID from Persona API
        string videoTimestamp; // Timestamp from video metadata
        bool governmentIdVerified;
        bool addressProofVerified;
    }
    // State variables
    uint256 private _nextPropertyId;
    mapping(uint256 => Property) public properties;
    mapping(uint256 => KYCProof) public kycProofs;
    mapping(address => uint256[]) public landlordProperties;
   
    // Fee structure
    uint256 public listingFee = 0.1 ether; // Fee to submit property.
    uint256 public kycProcessingFee = 0.05 ether; // Additional for enhanced KYC
    address public feeCollector;
   
    // Gas sponsorship for low-income users
    uint256 public sponsorshipPool;
    mapping(address => bool) public gasSponsored;
   
    // Events
    event PropertySubmitted(
        uint256 indexed propertyId,
        address indexed landlord,
        string propertyAddress,
        uint256 kycLevel
    );
    event PropertyVerified(uint256 indexed propertyId, address indexed verifier, uint256 kycLevel);
    event PropertyDeactivated(uint256 indexed propertyId, string reason);
    event KYCProofLinked(uint256 indexed propertyId, string personaVerificationId);
    event ListingFeeUpdated(uint256 oldFee, uint256 newFee);
    event GasSponsorshipGranted(address indexed user);
   
    constructor(address _feeCollector) ERC721("TrustLease Property Badge", "TLPB") Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        _nextPropertyId = 1;
    }
    /**
     * @notice Landlord submits property for verification with listing fee
     * @param _propertyAddress Physical address of the property
     * @param _documentHash IPFS hash containing ID, property docs, tax receipts
     * @param _videoHash IPFS hash for video walkthrough
     * @param _gpsCoordinates GPS coordinates from video metadata
     * @param _kycLevel 1 for basic, 2 for enhanced (with government ID)
     */
    function submitProperty(
        string memory _propertyAddress,
        string memory _documentHash,
        string memory _videoHash,
        string memory _gpsCoordinates,
        uint256 _kycLevel
    ) external payable nonReentrant returns (uint256) {
        require(bytes(_propertyAddress).length > 0, "Property address required");
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(bytes(_videoHash).length > 0, "Video hash required");
        require(bytes(_gpsCoordinates).length > 0, "GPS coordinates required");
        require(_kycLevel == 1 || _kycLevel == 2, "Invalid KYC level");
        // calculate required fee
        uint256 requiredFee = listingFee;
        if (_kycLevel == 2) {
            requiredFee += kycProcessingFee;
        }
        // Check if user has gas sponsorship fee waiver for low-income
        if (!gasSponsored[msg.sender]) {
            require(msg.value >= requiredFee, "Insufficient listing fee");
           
            // transfer fee to collector
            Address.sendValue(payable(feeCollector), msg.value);
        } else {
            // use sponsorship pool
            require(sponsorshipPool >= requiredFee, "Sponsorship pool depleted");
            sponsorshipPool -= requiredFee;
        }
        uint256 propertyId = _nextPropertyId++;
        properties[propertyId] = Property({
            owner: msg.sender,
            propertyAddress: _propertyAddress,
            documentHash: _documentHash,
            videoHash: _videoHash,
            gpsCoordinates: _gpsCoordinates,
            verificationDate: 0,
            isVerified: false,
            isActive: true,
            kycLevel: _kycLevel
        });
        landlordProperties[msg.sender].push(propertyId);
        emit PropertySubmitted(propertyId, msg.sender, _propertyAddress, _kycLevel);
       
        return propertyId;
    }
    /**
     * @notice Link off-chain KYC proof from Persona API
     * @param propertyId The property to link KYC to
     * @param _personaVerificationId Verification ID from Persona
     * @param _videoTimestamp Timestamp extracted from video metadata
     * @param _governmentIdVerified True if Persona verified government ID
     * @param _addressProofVerified True if address documents verified
     */
    function linkKYCProof(
        uint256 propertyId,
        string memory _personaVerificationId,
        string memory _videoTimestamp,
        bool _governmentIdVerified,
        bool _addressProofVerified
    ) external onlyOwner {
        Property memory property = properties[propertyId];
        require(property.owner != address(0), "Property does not exist");
        require(!property.isVerified, "Property already verified");
        require(bytes(_personaVerificationId).length > 0, "Persona ID required"); 
        require(bytes(_videoTimestamp).length > 0, "Video timestamp required");
        kycProofs[propertyId] = KYCProof({
            personaVerificationId: _personaVerificationId,
            videoTimestamp: _videoTimestamp,
            governmentIdVerified: _governmentIdVerified,
            addressProofVerified: _addressProofVerified
        });
        emit KYCProofLinked(propertyId, _personaVerificationId);
    }
    /**
     * @notice Admin verifies property after manual KYC check
     * @param propertyId The property to verify
     * @dev Mints NFT badge to landlord upon verification
     */
    function verifyProperty(uint256 propertyId) external onlyOwner {
        Property storage property = properties[propertyId];
        KYCProof memory proof = kycProofs[propertyId];
       
        require(property.owner != address(0), "Property does not exist");
        require(!property.isVerified, "Property already verified");
        require(property.isActive, "Property is deactivated");
        // enhanced KYC requires government ID verification
        if (property.kycLevel == 2) {
            require(proof.governmentIdVerified, "Government ID not verified");
            require(proof.addressProofVerified, "Address proof not verified");
        }
        property.isVerified = true;
        property.verificationDate = block.timestamp;
        // verification badge miniting  NFT to landlord
        _safeMint(property.owner, propertyId);
        emit PropertyVerified(propertyId, msg.sender, property.kycLevel);
    }
    /**
     * @notice Deactivate property for fraud or disputes
     * @param propertyId The property to deactivate
     * @param reason Reason for deactivation
     */
    function deactivateProperty(uint256 propertyId, string memory reason) external onlyOwner {
        Property storage property = properties[propertyId];
        require(property.owner != address(0), "Property does not exist");
        require(property.isActive, "Property already deactivated");
        property.isActive = false;
        emit PropertyDeactivated(propertyId, reason);
    }
    /**
     * @notice Grant gas sponsorship to low-income user
     * @param user User address to sponsor
     */
    function grantGasSponsorship(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        gasSponsored[user] = true;
        emit GasSponsorshipGranted(user);
    }
    /**
     * @notice Fund sponsorship pool for fee waivers
     */
    function fundSponsorshipPool() external payable {
        require(msg.value > 0, "Must send funds");
        sponsorshipPool += msg.value;
    }
    /**
     * @notice Admin withdraws unused sponsorship funds
     */
    function emergencyWithdrawSponsorship() external onlyOwner {
        require(sponsorshipPool > 0, "No funds to withdraw");
        uint256 amount = sponsorshipPool;
        sponsorshipPool = 0;
        Address.sendValue(payable(owner()), amount);
    }
    /**
     * @notice Update listing fee (admin only)
     * @param newFee New listing fee amount
     */
    function updateListingFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = listingFee;
        listingFee = newFee;
        emit ListingFeeUpdated(oldFee, newFee);
    }
    /**
     * @notice Update KYC processing fee (admin only)
     * @param newFee New KYC fee amount
     */
    function updateKYCFee(uint256 newFee) external onlyOwner {
        kycProcessingFee = newFee;
    }
    /**
     * @notice Check if property is verified and active
     * @param propertyId The property to check
     */
    function isPropertyVerified(uint256 propertyId) external view returns (bool) {
        Property memory property = properties[propertyId];
        return property.isVerified && property.isActive;
    }
    /**
     * @notice Get property owner address
     * @param propertyId The property ID
     */
    function getPropertyOwner(uint256 propertyId) external view returns (address) {
        return properties[propertyId].owner;
    }
    /**
     * @notice Get listing fee
     */
    function getListingFee() external view returns (uint256) {
        return listingFee;
    }
    /**
     * @notice Get full property details
     * @param propertyId The property ID
     */
    function getPropertyDetails(uint256 propertyId) external view returns (
        address owner,
        string memory propertyAddress,
        string memory documentHash,
        string memory videoHash,
        string memory gpsCoordinates,
        uint256 verificationDate,
        bool isVerified,
        bool isActive,
        uint256 kycLevel
    ) {
        Property memory property = properties[propertyId];
        return (
            property.owner,
            property.propertyAddress,
            property.documentHash,
            property.videoHash,
            property.gpsCoordinates,
            property.verificationDate,
            property.isVerified,
            property.isActive,
            property.kycLevel
        );
    }
    /**
     * @notice Get KYC proof details
     * @param propertyId The property ID
     */
    function getKYCProof(uint256 propertyId) external view returns (
        string memory personaVerificationId,
        string memory videoTimestamp,
        bool governmentIdVerified,
        bool addressProofVerified
    ) {
        KYCProof memory proof = kycProofs[propertyId];
        return (
            proof.personaVerificationId,
            proof.videoTimestamp,
            proof.governmentIdVerified,
            proof.addressProofVerified
        );
    }
    /**
     * @notice Get all properties owned by a landlord
     * @param landlord The landlord address
     */
    function getLandlordProperties(address landlord) external view returns (uint256[] memory) {
        return landlordProperties[landlord];
    }
    /**
     * @notice Override to prevent badge transfers (soulbound-like behavior)
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
       
        // Allow minting (from = address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("Property badges are non-transferable");
        }
       
        return super._update(to, tokenId, auth);
    }
}
