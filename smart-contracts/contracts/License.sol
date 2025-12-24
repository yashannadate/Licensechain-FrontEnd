// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LicenseChain - Decentralized Digital Licensing System
 * @dev Manages the issuance, revocation, verification, and renewal of business licenses.
 * @author [Your Name]
 */
contract LicenseChain {
    
    // --- 1. DATA STRUCTURES (The "Schema" of your Database) ---
    struct License {
        uint256 id;             // Unique ID for easy lookup (e.g., 101)
        string businessName;    // The name of the company/person
        address issuedTo;       // The MetaMask Wallet holding this license
        uint256 issueDate;      // Timestamp when it was created
        uint256 expiryDate;     // Timestamp when it expires
        bool isValid;           // Status: True = Active, False = Revoked
        bool exists;            // Security check to ensure ID is real
    }

    // --- 2. STATE VARIABLES (Data stored permanently on Blockchain) ---
    address public admin;                 // The Government/Admin Wallet
    uint256 public licenseCount;          // Counter to generate unique IDs
    mapping(uint256 => License) public licenses; // The actual database mapping IDs to License data
    
    // --- 3. EVENTS (Real-time Notifications for your React Frontend) ---
    event LicenseIssued(uint256 indexed licenseId, string businessName, address indexed issuedTo);
    event LicenseRevoked(uint256 indexed licenseId);
    event LicenseRenewed(uint256 indexed licenseId, uint256 newExpiryDate);
    event OwnershipTransferred(address indexed previousAdmin, address indexed newAdmin);

    // --- 4. MODIFIERS (Security Layers) ---
    // This code runs BEFORE the function body to check permissions.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Security Alert: Access Denied. Only Admin can perform this action.");
        _;
    }

    // --- 5. CONSTRUCTOR (Runs once on Deployment) ---
    constructor() {
        admin = msg.sender;     // The wallet deploying this contract becomes the Admin
        licenseCount = 100;     // We start IDs at 100 to look professional (e.g., ID #101)
    }

    // --- 6. CORE FUNCTIONS ---

    // [A] ISSUE LICENSE
    // Creates a new license and sets it to expire in 365 days.
    function issueLicense(string memory _businessName, address _issuedTo) public onlyAdmin {
        require(_issuedTo != address(0), "Error: Invalid Wallet Address"); // Safety check

        licenseCount++;
        uint256 newId = licenseCount;

        // Create and store the license
        licenses[newId] = License({
            id: newId,
            businessName: _businessName,
            issuedTo: _issuedTo,
            issueDate: block.timestamp,             // Current Blockchain Time
            expiryDate: block.timestamp + 365 days, // Valid for 1 year
            isValid: true,
            exists: true
        });

        // Notify the frontend
        emit LicenseIssued(newId, _businessName, _issuedTo);
    }

    // [B] REVOKE LICENSE
    // Used by Admin to cancel a license due to fraud or violation.
    function revokeLicense(uint256 _licenseId) public onlyAdmin {
        require(licenses[_licenseId].exists, "Error: License ID not found");
        require(licenses[_licenseId].isValid, "Error: License is already revoked");

        licenses[_licenseId].isValid = false;
        emit LicenseRevoked(_licenseId);
    }

    // [C] RENEW LICENSE
    // Extends the validity by another 365 days from TODAY.
    function renewLicense(uint256 _licenseId) public onlyAdmin {
        require(licenses[_licenseId].exists, "Error: License ID not found");
        
        // Update expiry to 1 year from now
        licenses[_licenseId].expiryDate = block.timestamp + 365 days;
        
        // If it was expired/revoked, reactivate it
        licenses[_licenseId].isValid = true; 

        emit LicenseRenewed(_licenseId, licenses[_licenseId].expiryDate);
    }

    // [D] VERIFY LICENSE (Public)
    // Returns TRUE only if: Exists + Valid Status + Not Expired
    function verifyLicense(uint256 _licenseId) public view returns (bool) {
        return (
            licenses[_licenseId].exists && 
            licenses[_licenseId].isValid && 
            block.timestamp <= licenses[_licenseId].expiryDate // Check if current time is before expiry
        );
    }

    // [E] GET DETAILS (Public)
    // Fetches all data to display on the Dashboard
    function getLicense(uint256 _licenseId) public view returns (
        uint256, string memory, address, uint256, uint256, bool
    ) {
        require(licenses[_licenseId].exists, "Error: License not found");
        License memory l = licenses[_licenseId];
        return (l.id, l.businessName, l.issuedTo, l.issueDate, l.expiryDate, l.isValid);
    }

    // [F] TRANSFER OWNERSHIP (Safety Feature)
    // Allows the Admin to hand over control to a new wallet (e.g., if keys are lost).
    function transferOwnership(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "Error: New admin cannot be zero address");
        emit OwnershipTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}