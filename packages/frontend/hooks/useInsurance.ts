'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { contracts } from '@/lib/config'
import { parseUnits, formatUnits } from 'viem'

// Hook for reading insurance details
export function useInsuranceDetails(insuranceId: bigint | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'insurances',
    args: insuranceId !== undefined ? [insuranceId] : undefined,
  })
}

// Hook for getting total number of insurances
export function useTotalInsurances() {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'insuranceCounter',
  })
}

// Hook for checking if user has bought insurance
export function useHasBoughtInsurance(insuranceId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'hasBought',
    args: insuranceId !== undefined && address ? [insuranceId, address] : undefined,
  })
}

// Hook for checking if user has claimed payout
export function useHasClaimedPayout(insuranceId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'hasClaimed',
    args: insuranceId !== undefined && address ? [insuranceId, address] : undefined,
  })
}

// Hook for USDT balance
export function useUSDTBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.mockUSDT.address,
    abi: contracts.mockUSDT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })
}

// Hook for USDT allowance
export function useUSDTAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  return useReadContract({
    address: contracts.mockUSDT.address,
    abi: contracts.mockUSDT.abi,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
  })
}

// Hook for approving USDT
export function useApproveUSDT() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (amount: bigint) => {
    writeContract({
      address: contracts.mockUSDT.address,
      abi: contracts.mockUSDT.abi,
      functionName: 'approve',
      args: [contracts.flightDelayInsurance.address, amount],
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for creating insurance
export function useCreateInsurance() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createInsurance = (
    flightQuestion: string,
    depositAmount: bigint,
    insurancePrice: bigint,
    totalPolicies: bigint
  ) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'createInsurance',
      args: [flightQuestion, depositAmount, insurancePrice, totalPolicies],
    })
  }

  return {
    createInsurance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for buying insurance
export function useBuyInsurance() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buyInsurance = (insuranceId: bigint) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'buyInsurance',
      args: [insuranceId],
    })
  }

  return {
    buyInsurance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for settling insurance
export function useSettleInsurance() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const settleInsurance = (insuranceId: bigint, answer: string) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'settleInsurance',
      args: [insuranceId, answer],
    })
  }

  return {
    settleInsurance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for claiming payout
export function useClaimPayout() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimPayout = (insuranceId: bigint) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'claimPayout',
      args: [insuranceId],
    })
  }

  return {
    claimPayout,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for withdrawing funds
export function useWithdrawFunds() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawFunds = (insuranceId: bigint) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'withdrawFunds',
      args: [insuranceId],
    })
  }

  return {
    withdrawFunds,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}