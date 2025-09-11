// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {FlightDelayInsurance} from "../src/FlightDelayInsurance.sol";

contract DeployAll is Script {
    address constant KAIA_TESTNET_REALITY_ORACLE = 0x8Ce72025f7678e3Fe0415E2C00D0684f7d45Deb0;
    
    function run() external returns (MockUSDT, FlightDelayInsurance) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MockUSDT mockUSDT = new MockUSDT();
        console.log("MockUSDT deployed at:", address(mockUSDT));
        
        FlightDelayInsurance insurance = new FlightDelayInsurance(
            address(mockUSDT),
            KAIA_TESTNET_REALITY_ORACLE
        );
        console.log("FlightDelayInsurance deployed at:", address(insurance));
        
        vm.stopBroadcast();
        
        return (mockUSDT, insurance);
    }
    
    function runLocal() external returns (MockUSDT, FlightDelayInsurance) {
        vm.startBroadcast();
        
        MockUSDT mockUSDT = new MockUSDT();
        console.log("MockUSDT deployed at:", address(mockUSDT));
        
        address mockOracle = address(0x1234567890123456789012345678901234567890);
        console.log("Using mock oracle address for local deployment");
        
        FlightDelayInsurance insurance = new FlightDelayInsurance(
            address(mockUSDT),
            mockOracle
        );
        console.log("FlightDelayInsurance deployed at:", address(insurance));
        
        vm.stopBroadcast();
        
        return (mockUSDT, insurance);
    }
    
    function runWithExistingToken(address tokenAddress) external returns (FlightDelayInsurance) {
        require(tokenAddress != address(0), "Invalid token address");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Using existing token at:", tokenAddress);
        
        FlightDelayInsurance insurance = new FlightDelayInsurance(
            tokenAddress,
            KAIA_TESTNET_REALITY_ORACLE
        );
        console.log("FlightDelayInsurance deployed at:", address(insurance));
        
        vm.stopBroadcast();
        
        return insurance;
    }
}