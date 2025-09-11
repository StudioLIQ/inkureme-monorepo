// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    uint256 public constant MINT_AMOUNT = 10_000 * 10**6;
    uint256 public constant MINT_COOLDOWN = 1 days;
    
    mapping(address => uint256) public lastMintTimestamp;
    
    constructor() ERC20("Mock-USDT", "mUSDT") {}
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint() public {
        require(
            lastMintTimestamp[msg.sender] == 0 || 
            block.timestamp >= lastMintTimestamp[msg.sender] + MINT_COOLDOWN,
            "MockUSDT: Must wait 24 hours between mints"
        );
        
        lastMintTimestamp[msg.sender] = block.timestamp;
        _mint(msg.sender, MINT_AMOUNT);
    }
}