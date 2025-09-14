'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contracts } from '@/lib/config'
import { Address } from 'viem'

// Flight info (numerics, status, ids)
export function useFlightInfo(flightId: bigint | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'getFlightInfo',
    args: flightId !== undefined ? [flightId] : undefined,
  })
}

// Flight metadata (codes, airports, time, threshold)
export function useFlightMetadata(flightId: bigint | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'getFlightMetadata',
    args: flightId !== undefined ? [flightId] : undefined,
  })
}

// Hook for getting total number of insurances
export function useTotalFlights() {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'getTotalFlights',
  })
}

// Hook for checking if user has bought insurance
export function useHasBoughtInsurance(insuranceId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'hasPurchasedPolicy',
    args: insuranceId !== undefined && address ? [insuranceId, address] : undefined,
  })
}

// Hook for checking if user has claimed payout
export function useHasClaimedPayout(insuranceId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'hasClaimedPayout',
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
    flightCode: string,
    departureAirport: string,
    arrivalAirport: string,
    departureTimestamp: bigint,
    delayThresholdMinutes: number,
    depositAmount: bigint,
    insurancePrice: bigint,
    totalPolicies: bigint
  ) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'createInsurance',
      args: [
        flightCode,
        departureAirport,
        arrivalAirport,
        Number(departureTimestamp),
        delayThresholdMinutes,
        depositAmount,
        insurancePrice,
        totalPolicies,
      ],
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

  const settleInsurance = (insuranceId: bigint) => {
    writeContract({
      address: contracts.flightDelayInsurance.address,
      abi: contracts.flightDelayInsurance.abi,
      functionName: 'settleInsurance',
      args: [insuranceId],
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

// Hook to read constant payout per policy
export function usePayoutPerPolicy() {
  return useReadContract({
    address: contracts.flightDelayInsurance.address,
    abi: contracts.flightDelayInsurance.abi,
    functionName: 'PAYOUT_PER_POLICY',
  })
}
