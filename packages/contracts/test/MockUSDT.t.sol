// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract MockUSDTTest is Test {
    MockUSDT public mockUSDT;
    address public user1;
    address public user2;
    
    function setUp() public {
        mockUSDT = new MockUSDT();
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
    }
    
    function test_TokenMetadata() public view {
        assertEq(mockUSDT.name(), "Mock-USDT");
        assertEq(mockUSDT.symbol(), "mUSDT");
        assertEq(mockUSDT.decimals(), 6);
    }
    
    function test_MintSuccess() public {
        vm.prank(user1);
        mockUSDT.mint();
        
        assertEq(mockUSDT.balanceOf(user1), 10_000 * 10**6);
        assertEq(mockUSDT.lastMintTimestamp(user1), block.timestamp);
    }
    
    function test_MintCooldownRevert() public {
        vm.prank(user1);
        mockUSDT.mint();
        
        vm.prank(user1);
        vm.expectRevert("MockUSDT: Must wait 24 hours between mints");
        mockUSDT.mint();
    }
    
    function test_MintAfterCooldown() public {
        vm.prank(user1);
        mockUSDT.mint();
        
        vm.warp(block.timestamp + 1 days);
        
        vm.prank(user1);
        mockUSDT.mint();
        
        assertEq(mockUSDT.balanceOf(user1), 20_000 * 10**6);
    }
    
    function test_MultipleMinters() public {
        vm.prank(user1);
        mockUSDT.mint();
        
        vm.prank(user2);
        mockUSDT.mint();
        
        assertEq(mockUSDT.balanceOf(user1), 10_000 * 10**6);
        assertEq(mockUSDT.balanceOf(user2), 10_000 * 10**6);
    }
}