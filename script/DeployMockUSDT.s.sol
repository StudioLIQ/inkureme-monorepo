// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract DeployMockUSDT is Script {
    function run() external returns (MockUSDT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MockUSDT mockUSDT = new MockUSDT();
        
        console.log("MockUSDT deployed at:", address(mockUSDT));
        
        vm.stopBroadcast();
        
        return mockUSDT;
    }
    
    function runLocal() external returns (MockUSDT) {
        vm.startBroadcast();
        
        MockUSDT mockUSDT = new MockUSDT();
        
        console.log("MockUSDT deployed at:", address(mockUSDT));
        
        vm.stopBroadcast();
        
        return mockUSDT;
    }
}