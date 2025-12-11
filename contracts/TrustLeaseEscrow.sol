// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol"; 

interface IPropertyVerification {
    function isPropertyVerified(uint256 propertyId) external view returns (bool);
    function getPropertyOwner(uint256 propertyId) external view returns (address);
    function getListingFee() external view returns (uint256);
}
interface IRentalReceipt {
    function mintReceipt(
        address tenant,
        address landlord,
        uint256 propertyId,
        uint256 depositAmount,
        uint256 rentAmount,
        uint256 startDate,
        uint256 endDate,
        string memory metadataHash
    ) external returns (uint256);
   
    function mintRentPaymentProof(
        address tenant,
        address landlord,
        uint256 agreementId,
        uint256 rentAmount,
        uint256 paymentDate,
        uint256 periodStart,
        uint256 periodEnd,
        string memory metadataHash
    ) external returns (uint256);
}

/**
 * @title TrustLeaseEscrow
 * @notice Core escrow contract with periodic rent payments, comprehensive fees, and enhanced dispute resolution
 * @dev Integrates with PropertyVerification and RentalReceipt contracts
 */
contract TrustLeaseEscrow is Ownable, ReentrancyGuard, Pausable {
   
    // Rental agreement status
    enum AgreementStatus {
        Pending, // Deposit locked, awaiting verification
        Active, // Both parties confirmed, rental active
        Completed, // Lease ended successfully
        Disputed, // Dispute raised
        Cancelled, // Cancelled before activation
        Terminated // Early termination
    }
    // Rent payment status
    enum RentStatus {
        Paid,
        Overdue,
        Disputed
    }

    // Rental agreement structure with periodic rent
    struct RentalAgreement {
        uint256 agreementId;
        uint256 propertyId;
        address tenant;
        address landlord;
        uint256 depositAmount;
        uint256 monthlyRent;
        uint256 rentInterval;
        uint256 startDate;
        uint256 endDate;
        uint256 createdAt;
        AgreementStatus status;
        string metadataHash;
        bool tenantConfirmed;
        bool landlordConfirmed;
        uint256 disputeDeadline;
        uint256 nextRentDueDate; 
        uint256 overdueGracePeriod;
        uint256 totalRentPaid;
    }

    // Rent payment tracking
    struct RentPayment {
        uint256 agreementId;
        uint256 amount;
        uint256 paidDate;
        uint256 periodStart;
        uint256 periodEnd;
        RentStatus status;
    }
    // Dispute structure with evidence submission
    struct Dispute {
        uint256 agreementId;
        address initiator;
        string reason;
        string[] evidenceHashes;
        uint256 createdAt;
        bool resolved;
        address winner;
        bool isRentDispute;
    }
    // Fee breakdown structure
    struct FeeBreakdown {
        uint256 depositAmount;
        uint256 totalRentPaid;
        uint256 platformFeeOnDeposit;
        uint256 platformFeeOnRent;
        uint256 listingFee;
        uint256 totalGasSponsored;
        uint256 netToLandlord;
        uint256 netToTenant; // for refunds
    }

    // State variables
    IPropertyVerification public propertyVerification;
    IRentalReceipt public rentalReceipt;
   
    uint256 private _nextAgreementId;
    mapping(uint256 => RentalAgreement) public agreements;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => RentPayment[]) public rentPayments; 
    mapping(address => uint256[]) public tenantAgreements;
    mapping(address => uint256[]) public landlordAgreements;
    mapping(uint256 => uint256) private lastOverdueCheck; // cooldown for checkRentOverdue per agreement
   
    // Fee structure
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public rentProcessingFeePercent = 1; // 1% on rent payments (lower than deposit)
    uint256 public disputePeriod = 7 days;
    uint256 public defaultGracePeriod = 3 days; // grace period for late rent
    address public platformWallet;
   
    // Gas sponsorship pool for low-income tenants
    uint256 public gasSubsidyPool;
    mapping(address => bool) public isGasSubsidized;
    // Events
    event AgreementCreated(
        uint256 indexed agreementId,
        uint256 indexed propertyId,
        address indexed tenant,
        address landlord,
        uint256 depositAmount,
        uint256 monthlyRent,
        uint256 rentInterval
    );
    event TenantConfirmed(uint256 indexed agreementId);
    event LandlordConfirmed(uint256 indexed agreementId);
    event RentPaid(
        uint256 indexed agreementId,
        uint256 amount,
        uint256 periodStart,
        uint256 periodEnd,
        uint256 nextDueDate
    );
    event RentOverdue(uint256 indexed agreementId, uint256 daysOverdue);
    event DepositReleased(uint256 indexed agreementId, uint256 amount, uint256 platformFee);
    event DisputeRaised(
        uint256 indexed agreementId,
        address indexed initiator,
        string reason,
        bool isRentDispute
    );
    event EvidenceSubmitted(uint256 indexed agreementId, string evidenceHash);
    event DisputeResolved(uint256 indexed agreementId, address indexed winner);
    event AgreementCancelled(uint256 indexed agreementId);
    event TenantRefunded(uint256 indexed agreementId, uint256 amount);
    event FeeBreakdownCalculated(uint256 indexed agreementId, uint256 landlordNet, uint256 platformTotal);
    event GasSubsidyGranted(address indexed tenant);
    event AgreementTerminated(uint256 indexed agreementId, uint256 refundAmount);
    constructor(
        address _propertyVerification,
        address _rentalReceipt,
        address _platformWallet
    ) Ownable(msg.sender) {
        require(_propertyVerification != address(0), "Invalid property verification address");
        require(_rentalReceipt != address(0), "Invalid rental receipt address");
        require(_platformWallet != address(0), "Invalid platform wallet");
        propertyVerification = IPropertyVerification(_propertyVerification);
        rentalReceipt = IRentalReceipt(_rentalReceipt);
        platformWallet = _platformWallet;
        _nextAgreementId = 1;
    }
    /**
     * @notice Create rental agreement with deposit and periodic rent terms
     * @param propertyId Verified property ID
     * @param landlord Landlord's address
     * @param monthlyRent Monthly rent amount in wei
     * @param rentInterval Rent payment interval in seconds (example 30 days = 2592000)
     * @param startDate Rental start timestamp
     * @param endDate Rental end timestamp
     * @param metadataHash IPFS hash containing full agreement terms
     */
    function createAgreement(
        uint256 propertyId,
        address landlord,
        uint256 monthlyRent,
        uint256 rentInterval,
        uint256 startDate,
        uint256 endDate,
        string memory metadataHash
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Deposit must be greater than zero");
        require(monthlyRent > 0, "Monthly rent must be greater than zero");
        require(rentInterval >= 1 days && rentInterval <= 365 days, "Invalid rent interval");
        require(propertyVerification.isPropertyVerified(propertyId), "Property not verified");
        require(landlord == propertyVerification.getPropertyOwner(propertyId), "Landlord mismatch");
        require(landlord != msg.sender, "Landlord cannot be tenant");
        require(endDate > startDate, "Invalid rental period");
        require(startDate >= block.timestamp, "Start date must be in future");
        uint256 agreementId = _nextAgreementId++;
        agreements[agreementId] = RentalAgreement({
            agreementId: agreementId,
            propertyId: propertyId,
            tenant: msg.sender,
            landlord: landlord,
            depositAmount: msg.value,
            monthlyRent: monthlyRent,
            rentInterval: rentInterval,
            startDate: startDate,
            endDate: endDate,
            createdAt: block.timestamp,
            status: AgreementStatus.Pending,
            metadataHash: metadataHash,
            tenantConfirmed: false,
            landlordConfirmed: false,
            disputeDeadline: 0,
            nextRentDueDate: startDate + rentInterval,
            overdueGracePeriod: defaultGracePeriod,
            totalRentPaid: 0
        });
        tenantAgreements[msg.sender].push(agreementId);
        landlordAgreements[landlord].push(agreementId);
        emit AgreementCreated(
            agreementId,
            propertyId,
            msg.sender,
            landlord,
            msg.value,
            monthlyRent,
            rentInterval
        );
       
        return agreementId;
    }
    /**
     * @notice Tenant confirms property after walkthrough
     * @param agreementId The agreement ID
     */
    function tenantConfirm(uint256 agreementId) external nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.tenant == msg.sender, "Not the tenant");
        require(agreement.status == AgreementStatus.Pending, "Agreement not pending");
        require(!agreement.tenantConfirmed, "Already confirmed");
        agreement.tenantConfirmed = true;
        emit TenantConfirmed(agreementId);
        if (agreement.landlordConfirmed) {
            _activateAgreement(agreementId);
        }
    }
    /**
     * @notice Landlord confirms tenant details
     * @param agreementId The agreement ID
     */
    function landlordConfirm(uint256 agreementId) external nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.landlord == msg.sender, "Not the landlord");
        require(agreement.status == AgreementStatus.Pending, "Agreement not pending");
        require(!agreement.landlordConfirmed, "Already confirmed");
        agreement.landlordConfirmed = true;
        emit LandlordConfirmed(agreementId);
        if (agreement.tenantConfirmed) {
            _activateAgreement(agreementId);
        }
    }
    /**
     * @notice Internal function to activate agreement
     */
    function _activateAgreement(uint256 agreementId) private {
        RentalAgreement storage agreement = agreements[agreementId];
        agreement.status = AgreementStatus.Active;
        agreement.disputeDeadline = block.timestamp + disputePeriod;
    }
    /**
     * @notice Pay monthly rent
     * @param agreementId The agreement ID
     * @param metadataHash IPFS hash with payment proof or receipt
     */
    function payRent(uint256 agreementId, string memory metadataHash)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.status == AgreementStatus.Active, "Agreement not active");
        require(msg.sender == agreement.tenant, "Not the tenant");
        require(msg.value >= agreement.monthlyRent, "Insufficient rent amount");
        require(block.timestamp <= agreement.endDate, "Lease has ended");
        // calculatation of the rent period.
        uint256 periodStart = agreement.nextRentDueDate - agreement.rentInterval;
        uint256 periodEnd = agreement.nextRentDueDate;
        // record payment
        rentPayments[agreementId].push(RentPayment({
            agreementId: agreementId,
            amount: msg.value,
            paidDate: block.timestamp,
            periodStart: periodStart,
            periodEnd: periodEnd,
            status: RentStatus.Paid
        }));
        agreement.totalRentPaid += msg.value;
        agreement.nextRentDueDate += agreement.rentInterval;
        // calculate and transfer rent with lower processing fee
        uint256 processingFee = (msg.value * rentProcessingFeePercent) / 100;
        uint256 landlordAmount = msg.value - processingFee;
        // handles gas subsidy if tenant is subsidized
        if (isGasSubsidized[msg.sender] && gasSubsidyPool > 0) {
            uint256 gasRefund = tx.gasprice * gasleft() > gasSubsidyPool ? gasSubsidyPool : tx.gasprice * gasleft();
            gasSubsidyPool -= gasRefund;
            Address.sendValue(payable(msg.sender), gasRefund);
        }
        // refund excess if overpaid
        uint256 excess = msg.value - agreement.monthlyRent;
        if (excess > 0) {
            Address.sendValue(payable(msg.sender), excess);
        }
        // ttransfer rent to landlord
        Address.sendValue(payable(agreement.landlord), landlordAmount);
        // transfer processing fee to platform
        Address.sendValue(payable(platformWallet), processingFee);
        
        // Mint rent payment proof NFT to tenant
        rentalReceipt.mintRentPaymentProof(
            agreement.tenant,
            agreement.landlord,
            agreementId,
            msg.value,
            block.timestamp,
            periodStart,
            periodEnd,
            metadataHash
        );
        emit RentPaid(agreementId, msg.value, periodStart, periodEnd, agreement.nextRentDueDate);
    }
    /**
     * @notice Check and flag overdue rent payments
     * @param agreementId The agreement ID
     * @dev Anyone can call this to flag overdue payments
     */
    function checkRentOverdue(uint256 agreementId) external {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.status == AgreementStatus.Active, "Agreement not active");
        require(msg.sender == agreement.tenant || msg.sender == agreement.landlord || msg.sender == owner(), "Not authorized"); // Limit callers to prevent spam
        require(block.timestamp > lastOverdueCheck[agreementId] + 1 days, "Cooldown: Check once per day");
       
        uint256 dueDate = agreement.nextRentDueDate;
        uint256 graceEnd = dueDate + agreement.overdueGracePeriod;
       
        require(block.timestamp > graceEnd, "Still within grace period");
       
        uint256 daysOverdue = (block.timestamp - graceEnd) / 1 days;
       
        emit RentOverdue(agreementId, daysOverdue);
        lastOverdueCheck[agreementId] = block.timestamp; // cooldown updation.
       
        // auto-flag for dispute if 3.... days overdue
        if (daysOverdue >= 3 && agreement.status != AgreementStatus.Disputed) {
            _autoRaiseRentDispute(agreementId);
        }
    }
    /**
     * @notice Internal function to auto-raise rent dispute
     */
    function _autoRaiseRentDispute(uint256 agreementId) private {
        RentalAgreement storage agreement = agreements[agreementId];
        agreement.status = AgreementStatus.Disputed;
        string[] memory emptyEvidence = new string[](0);
        disputes[agreementId] = Dispute({
            agreementId: agreementId,
            initiator: address(this), 
            reason: "Rent payment overdue beyond grace period",
            evidenceHashes: emptyEvidence,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0),
            isRentDispute: true
        });
        emit DisputeRaised(agreementId, address(this), "Auto-flagged: Rent overdue", true);
    }
    /**
     * @notice Release deposit to landlord after lease ends
     * @param agreementId The agreement ID
     */
    function releaseDeposit(uint256 agreementId) external nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(
            agreement.status == AgreementStatus.Active ||
            agreement.status == AgreementStatus.Completed,
            "Agreement not releasable"
        );
        require(
            msg.sender == agreement.tenant ||
            msg.sender == agreement.landlord ||
            msg.sender == owner(),
            "Not authorized"
        );
        require(block.timestamp >= agreement.disputeDeadline, "Dispute period not ended");
        require(block.timestamp >= agreement.endDate, "Lease not ended");
        agreement.status = AgreementStatus.Completed;
        // calculate platform fee on deposit
        uint256 platformFee = (agreement.depositAmount * platformFeePercent) / 100;
        uint256 landlordAmount = agreement.depositAmount - platformFee;
        // transfer deposit to landlord
        Address.sendValue(payable(agreement.landlord), landlordAmount);
        Address.sendValue(payable(platformWallet), platformFee);
        // Mint final rental receipt NFT to tenant
        rentalReceipt.mintReceipt(
            agreement.tenant,
            agreement.landlord,
            agreement.propertyId,
            agreement.depositAmount,
            agreement.monthlyRent,
            agreement.startDate,
            agreement.endDate,
            agreement.metadataHash
        );
        emit DepositReleased(agreementId, landlordAmount, platformFee);
       
        // Emit fee breakdown for transparency
        _emitFeeBreakdown(agreementId);
    }
    /**
     * @notice Calculate and emit comprehensive fee breakdown
     */
    function _emitFeeBreakdown(uint256 agreementId) private {
        RentalAgreement memory agreement = agreements[agreementId];
       
        uint256 depositFee = (agreement.depositAmount * platformFeePercent) / 100;
        uint256 rentFees = (agreement.totalRentPaid * rentProcessingFeePercent) / 100;
        uint256 totalPlatformFees = depositFee + rentFees;
        uint256 landlordNet = (agreement.depositAmount - depositFee) + (agreement.totalRentPaid - rentFees);
       
        emit FeeBreakdownCalculated(agreementId, landlordNet, totalPlatformFees);
    }
    /**
     * @notice Raise dispute with evidence submission
     * @param agreementId The agreement ID
     * @param reason Dispute reason
     * @param evidenceHash IPFS hash containing evidence (photos, receipts, messages)
     */
    function raiseDispute(
        uint256 agreementId,
        string memory reason,
        string memory evidenceHash
    ) external nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(
            agreement.status == AgreementStatus.Active ||
            agreement.status == AgreementStatus.Pending,
            "Agreement not disputable"
        );
        require(
            msg.sender == agreement.tenant || msg.sender == agreement.landlord,
            "Not authorized"
        );
        require(bytes(reason).length > 0, "Reason required");
        agreement.status = AgreementStatus.Disputed;
        string[] memory initialEvidence = new string[](1);
        initialEvidence[0] = evidenceHash;
        disputes[agreementId] = Dispute({
            agreementId: agreementId,
            initiator: msg.sender,
            reason: reason,
            evidenceHashes: initialEvidence,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0),
            isRentDispute: false
        });
        emit DisputeRaised(agreementId, msg.sender, reason, false);
        emit EvidenceSubmitted(agreementId, evidenceHash);
    }
    /**
     * @notice Submit additional evidence to existing dispute
     * @param agreementId The agreement ID
     * @param evidenceHash IPFS hash of new evidence
     */
    function submitEvidence(uint256 agreementId, string memory evidenceHash) external {
        RentalAgreement memory agreement = agreements[agreementId];
        Dispute storage dispute = disputes[agreementId];
       
        require(agreement.status == AgreementStatus.Disputed, "No active dispute");
        require(
            msg.sender == agreement.tenant || msg.sender == agreement.landlord,
            "Not authorized"
        );
        require(!dispute.resolved, "Dispute already resolved");
        require(bytes(evidenceHash).length > 0, "Evidence hash required");
        dispute.evidenceHashes.push(evidenceHash);
        emit EvidenceSubmitted(agreementId, evidenceHash);
    }
    /**
     * @notice Admin resolves dispute with evidence review
     * @param agreementId The agreement ID
     * @param refundTenant True to refund tenant, false to release to landlord
     */
    function resolveDispute(uint256 agreementId, bool refundTenant) external onlyOwner nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        Dispute storage dispute = disputes[agreementId];
       
        require(agreement.status == AgreementStatus.Disputed, "Agreement not disputed");
        require(!dispute.resolved, "Dispute already resolved");
        dispute.resolved = true;
        if (refundTenant) {
            dispute.winner = agreement.tenant;
            agreement.status = AgreementStatus.Terminated;
            // Refund deposit + any prepaid rent if applicable
            uint256 refundAmount = agreement.depositAmount;
           
            Address.sendValue(payable(agreement.tenant), refundAmount);
            emit TenantRefunded(agreementId, refundAmount);
        } else {
            dispute.winner = agreement.landlord;
            agreement.status = AgreementStatus.Completed;
            // Release deposit to landlord with fees
            uint256 platformFee = (agreement.depositAmount * platformFeePercent) / 100;
            uint256 landlordAmount = agreement.depositAmount - platformFee;
            Address.sendValue(payable(agreement.landlord), landlordAmount);
            Address.sendValue(payable(platformWallet), platformFee);
            emit DepositReleased(agreementId, landlordAmount, platformFee);
        }
        emit DisputeResolved(agreementId, dispute.winner);
    }
    /**
     * @notice Cancel agreement before activation (full refund)
     * @param agreementId The agreement ID
     */
    function cancelAgreement(uint256 agreementId) external nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.status == AgreementStatus.Pending, "Agreement not pending");
        require(msg.sender == agreement.tenant, "Only tenant can cancel");
        agreement.status = AgreementStatus.Cancelled;
        // Full refund for cancellation during pending
        Address.sendValue(payable(agreement.tenant), agreement.depositAmount);
        emit AgreementCancelled(agreementId);
        emit TenantRefunded(agreementId, agreement.depositAmount);
    }
    /**
     * @notice Admin-approved early termination with pro-rated refund
     * @param agreementId The agreement ID
     * @param proRatedRefund Amount to refund tenant (calculated off-chain)
     */
    function terminateAgreement(uint256 agreementId, uint256 proRatedRefund) external onlyOwner nonReentrant {
        RentalAgreement storage agreement = agreements[agreementId];
        require(agreement.status == AgreementStatus.Active || agreement.status == AgreementStatus.Disputed, "Invalid status for termination");
        require(proRatedRefund <= agreement.depositAmount + agreement.totalRentPaid, "Refund exceeds total paid");

        agreement.status = AgreementStatus.Terminated;

        // Refund pro-rated to tenant
        if (proRatedRefund > 0) {
            Address.sendValue(payable(agreement.tenant), proRatedRefund);
            emit TenantRefunded(agreementId, proRatedRefund);
        }

        // Release remaining to landlord minus fees
        uint256 remaining = agreement.depositAmount + agreement.totalRentPaid - proRatedRefund;
        if (remaining > 0) {
            uint256 platformFee = (remaining * platformFeePercent) / 100;
            uint256 landlordAmount = remaining - platformFee;
            Address.sendValue(payable(agreement.landlord), landlordAmount);
            Address.sendValue(payable(platformWallet), platformFee);
            emit DepositReleased(agreementId, landlordAmount, platformFee);
        }

        emit AgreementTerminated(agreementId, proRatedRefund);
    }
    /**
     * @notice Get agreement details
     */
    function getAgreement(uint256 agreementId) external view returns (RentalAgreement memory) {
        return agreements[agreementId];
    }
    /**
     * @notice Get all rent payments for an agreement
     */
    function getRentPayments(uint256 agreementId) external view returns (RentPayment[] memory) {
        return rentPayments[agreementId];
    }
    /**
     * @notice Get dispute details with evidence
     */
    function getDispute(uint256 agreementId) external view returns (
        address initiator,
        string memory reason,
        string[] memory evidenceHashes,
        uint256 createdAt,
        bool resolved,
        address winner,
        bool isRentDispute
    ) {
        Dispute memory dispute = disputes[agreementId];
        return (
            dispute.initiator,
            dispute.reason,
            dispute.evidenceHashes,
            dispute.createdAt,
            dispute.resolved,
            dispute.winner,
            dispute.isRentDispute
        );
    }
    /**
     * @notice Calculate total fees for an agreement (view only)
     */
    function calculateFeeBreakdown(uint256 agreementId) external view returns (FeeBreakdown memory) {
        RentalAgreement memory agreement = agreements[agreementId];
       
        uint256 depositFee = (agreement.depositAmount * platformFeePercent) / 100;
        uint256 rentFees = (agreement.totalRentPaid * rentProcessingFeePercent) / 100;
        uint256 landlordNet = (agreement.depositAmount - depositFee) + (agreement.totalRentPaid - rentFees);
       
        return FeeBreakdown({
            depositAmount: agreement.depositAmount,
            totalRentPaid: agreement.totalRentPaid,
            platformFeeOnDeposit: depositFee,
            platformFeeOnRent: rentFees,
            listingFee: propertyVerification.getListingFee(),
            totalGasSponsored: 0, // Calculated separately
            netToLandlord: landlordNet,
            netToTenant: 0
        });
    }
    /**
     * @notice Grant gas subsidy to low-income tenant
     */
    function grantGasSubsidy(address tenant) external onlyOwner {
        require(tenant != address(0), "Invalid tenant address");
        isGasSubsidized[tenant] = true;
        emit GasSubsidyGranted(tenant);
    }
    /**
     * @notice Fund gas subsidy pool
     */
    function fundGasSubsidy() external payable {
        require(msg.value > 0, "Must send funds");
        gasSubsidyPool += msg.value;
    }
    /**
     * @notice Get tenant's agreements
     */
    function getTenantAgreements(address tenant) external view returns (uint256[] memory) {
        return tenantAgreements[tenant];
    }
    /**
     * @notice Get landlord's agreements
     */
    function getLandlordAgreements(address landlord) external view returns (uint256[] memory) {
        return landlordAgreements[landlord];
    }
    /**
     * @notice Update platform fee (admin only)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 5, "Fee too high");
        platformFeePercent = newFeePercent;
    }
    /**
     * @notice Update rent processing fee (admin only)
     */
    function updateRentProcessingFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 3, "Fee too high");
        rentProcessingFeePercent = newFeePercent;
    }
    /**
     * @notice Update dispute period (admin only)
     */
    function updateDisputePeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid period");
        disputePeriod = newPeriod;
    }
    /**
     * @notice Update default grace period for rent (admin only)
     */
    function updateGracePeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= 7 days, "Invalid grace period");
        defaultGracePeriod = newPeriod;
    }
    /**
     * @notice Emergency pause (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }
}