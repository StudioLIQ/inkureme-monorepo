// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {FlightDelayInsurance} from "../src/FlightDelayInsurance.sol";
import {MockRealityERC20} from "../src/mocks/MockRealityERC20.sol";

contract DeployMockInsurance is Script {
    function run() external returns (MockRealityERC20, FlightDelayInsurance) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address token = vm.envAddress("TOKEN_ADDRESS");

        vm.startBroadcast(pk);
        MockRealityERC20 oracle = new MockRealityERC20();
        console.log("MockReality deployed at:", address(oracle));

        FlightDelayInsurance insurance = new FlightDelayInsurance(token, address(oracle));
        console.log("FlightDelayInsurance (mock oracle) at:", address(insurance));

        vm.stopBroadcast();
        return (oracle, insurance);
    }
}

