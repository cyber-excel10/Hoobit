// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ITrustLease
 * @notice Shared interfaces for TrustLease contract interactions
 */

interface IPropertyVerification {
    function isPropertyVerified(uint256 propertyId) external view returns (bool);
    function getPropertyOwner(uint256 propertyId) external view returns (address);
    function getPropertyDetails(uint256 propertyId) external view returns (
        address owner,
        string memory propertyAddress,
        string memory documentHash,
        bool isVerified
    );
    function getListingFee() external view returns (uint256);
}

interface IRentalReceipt {
    function mintReceipt(
        address tenant,
        uint256 propertyId,
        uint256 depositAmount,
        uint256 rentAmount,
        uint256 startDate,
        uint256 endDate,
        string memory metadataHash
    ) external returns (uint256);
    
    function mintRentPaymentProof(
        address tenant,
        uint256 agreementId,
        uint256 rentAmount,
        uint256 paymentDate,
        uint256 periodStart,
        uint256 periodEnd
    ) external returns (uint256);
}