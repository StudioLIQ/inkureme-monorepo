// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {FlightDelayInsurance} from "../src/FlightDelayInsurance.sol";

contract SeedInsurances is Script {
    struct FlightSeed {
        string code;
        string from;
        string to;
        uint64 departAt; // epoch seconds
        uint16 delayMinutes;
        uint256 price; // in mUSDT (6 decimals)
        uint256 totalPolicies;
    }

    function run() external {
        address insuranceAddr = vm.envAddress("INSURANCE_ADDRESS");
        address tokenAddr = vm.envAddress("TOKEN_ADDRESS");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        FlightDelayInsurance insurance = FlightDelayInsurance(insuranceAddr);
        MockUSDT token = MockUSDT(tokenAddr);

        vm.startBroadcast(pk);

        // 1) Mint once (10,000 mUSDT) and approve insurance contract for max allowance
        token.mint();
        console.log("Minted mUSDT to:", msg.sender);
        token.approve(insuranceAddr, type(uint256).max);
        console.log("Approved insurance contract to spend mUSDT");

        // 2) Build a batch of sample flights covering next 14 weeks
        uint64 nowTs = uint64(block.timestamp);
        uint64 oneDay = 24 * 60 * 60;
        uint64 oneWeek = 7 * oneDay;

        FlightSeed[20] memory seeds;

        // Helper: base departures spread roughly every 3-4 days over 14 weeks
        uint64[20] memory offs = [
            oneDay * 2,
            oneDay * 4,
            oneDay * 7,
            oneDay * 10,
            oneDay * 14,
            oneDay * 18,
            oneDay * 22,
            oneDay * 26,
            oneDay * 30,
            oneDay * 34,
            oneDay * 38,
            oneDay * 42,
            oneDay * 46,
            oneDay * 50,
            oneDay * 54,
            oneDay * 58,
            oneDay * 62,
            oneDay * 66,
            oneDay * 70,
            oneDay * 74
        ];

        // Common parameters
        uint16[4] memory delays = [uint16(30), uint16(45), uint16(60), uint16(90)];
        uint256 price = 20 * 10**6; // 20 mUSDT
        uint256 totalPolicies = 5;  // keep overall deposit <= 10,000 mUSDT

        // Populate with varied routes/codes
        seeds[0] =  FlightSeed("KA101", "ICN", "NRT", nowTs + offs[0],  delays[0], price, totalPolicies);
        seeds[1] =  FlightSeed("KA202", "ICN", "HND", nowTs + offs[1],  delays[1], price, totalPolicies);
        seeds[2] =  FlightSeed("KA303", "GMP", "KIX", nowTs + offs[2],  delays[2], price, totalPolicies);
        seeds[3] =  FlightSeed("KA404", "ICN", "LAX", nowTs + offs[3],  delays[3], price, totalPolicies);
        seeds[4] =  FlightSeed("KA505", "ICN", "SFO", nowTs + offs[4],  delays[2], price, totalPolicies);
        seeds[5] =  FlightSeed("KA606", "ICN", "SIN", nowTs + offs[5],  delays[1], price, totalPolicies);
        seeds[6] =  FlightSeed("KA707", "ICN", "BKK", nowTs + offs[6],  delays[0], price, totalPolicies);
        seeds[7] =  FlightSeed("KA808", "ICN", "HKG", nowTs + offs[7],  delays[1], price, totalPolicies);
        seeds[8] =  FlightSeed("KA909", "PUS", "NRT", nowTs + offs[8],  delays[2], price, totalPolicies);
        seeds[9] =  FlightSeed("KA110", "ICN", "CDG", nowTs + offs[9],  delays[3], price, totalPolicies);
        seeds[10] = FlightSeed("KA111", "ICN", "FRA", nowTs + offs[10], delays[2], price, totalPolicies);
        seeds[11] = FlightSeed("KA112", "ICN", "LHR", nowTs + offs[11], delays[3], price, totalPolicies);
        seeds[12] = FlightSeed("KA113", "ICN", "SYD", nowTs + offs[12], delays[1], price, totalPolicies);
        seeds[13] = FlightSeed("KA114", "ICN", "MEL", nowTs + offs[13], delays[2], price, totalPolicies);
        seeds[14] = FlightSeed("KA115", "ICN", "DXB", nowTs + offs[14], delays[1], price, totalPolicies);
        seeds[15] = FlightSeed("KA116", "ICN", "DOH", nowTs + offs[15], delays[0], price, totalPolicies);
        seeds[16] = FlightSeed("KA117", "ICN", "JFK", nowTs + offs[16], delays[3], price, totalPolicies);
        seeds[17] = FlightSeed("KA118", "ICN", "SEA", nowTs + offs[17], delays[2], price, totalPolicies);
        seeds[18] = FlightSeed("KA119", "ICN", "YVR", nowTs + offs[18], delays[1], price, totalPolicies);
        seeds[19] = FlightSeed("KA120", "ICN", "SZX", nowTs + offs[19], delays[0], price, totalPolicies);

        // 3) Create insurances; deposit must be >= PAYOUT_PER_POLICY * totalPolicies
        uint256 payoutPerPolicy = insurance.PAYOUT_PER_POLICY(); // 100 mUSDT

        for (uint256 i = 0; i < seeds.length; i++) {
            FlightSeed memory f = seeds[i];
            uint256 deposit = payoutPerPolicy * f.totalPolicies;

            uint256 flightId = insurance.createInsurance(
                f.code,
                f.from,
                f.to,
                f.departAt,
                f.delayMinutes,
                deposit,
                f.price,
                f.totalPolicies
            );

            console.log("Created insurance:", flightId);
            console.log(string.concat("  ", f.code, " ", f.from, "->", f.to));
            console.log("  depart:", f.departAt);
            console.log("  delay(min):", uint256(f.delayMinutes));
            console.log("  price:", f.price);
            console.log("  deposit:", deposit);
            console.log("  total:", f.totalPolicies);
        }

        vm.stopBroadcast();
    }
}
