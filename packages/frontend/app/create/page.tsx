'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useCreateInsurance, useApproveUSDT, useUSDTAllowance, useUSDTBalance } from '@/hooks/useInsurance'
import { contracts } from '@/lib/config'

export default function CreateInsurance() {
  const { address, isConnected } = useAccount()
  const [formData, setFormData] = useState({
    flightQuestion: '',
    depositAmount: '',
    insurancePrice: '',
    totalPolicies: '',
  })
  const [step, setStep] = useState<'form' | 'approve' | 'create' | 'success'>('form')

  const { data: balance } = useUSDTBalance(address)
  const { data: allowance } = useUSDTAllowance(address, contracts.flightDelayInsurance.address)
  
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: approveSuccess, error: approveError } = useApproveUSDT()
  const { createInsurance, isPending: isCreating, isConfirming: isCreatingConfirming, isSuccess: createSuccess, error: createError, hash } = useCreateInsurance()

  const depositAmountBigInt = formData.depositAmount ? parseUnits(formData.depositAmount, 6) : BigInt(0)
  const insurancePriceBigInt = formData.insurancePrice ? parseUnits(formData.insurancePrice, 6) : BigInt(0)
  const totalPoliciesBigInt = formData.totalPolicies ? BigInt(formData.totalPolicies) : BigInt(0)

  const needsApproval = allowance !== undefined && depositAmountBigInt > (allowance as bigint)

  const handleCreate = useCallback(() => {
    createInsurance(
      formData.flightQuestion,
      depositAmountBigInt,
      insurancePriceBigInt,
      totalPoliciesBigInt
    )
  }, [createInsurance, formData.flightQuestion, depositAmountBigInt, insurancePriceBigInt, totalPoliciesBigInt])

  useEffect(() => {
    if (approveSuccess && step === 'approve') {
      setStep('create')
      handleCreate()
    }
  }, [approveSuccess, step, handleCreate])

  useEffect(() => {
    if (createSuccess) {
      setStep('success')
    }
  }, [createSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) return

    if (needsApproval) {
      setStep('approve')
      approve(depositAmountBigInt)
    } else {
      setStep('create')
      handleCreate()
    }
  }

  const resetForm = () => {
    setFormData({
      flightQuestion: '',
      depositAmount: '',
      insurancePrice: '',
      totalPolicies: '',
    })
    setStep('form')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect KAIA Wallet Required</h2>
            <p className="text-muted">
              Please connect your KAIA Wallet to create insurance policies.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-primary">Insurance Created Successfully!</h2>
            <p className="text-muted mb-6">
              Your flight delay insurance policy has been created and is now available for purchase.
            </p>
            {hash && (
              <a
                href={`https://baobab.kaiascan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:opacity-90 text-sm font-mono break-all"
              >
                View Transaction: {hash}
              </a>
            )}
            <button
              onClick={resetForm}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
            >
              Create Another Policy
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-6">Create Flight Insurance Policy</h1>

          {balance !== undefined && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted">Your mUSDT Balance:</p>
              <p className="text-xl font-mono font-semibold">
                {formatUnits(balance as bigint, 6)} mUSDT
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Flight Question for Oracle
              </label>
              <textarea
                value={formData.flightQuestion}
                onChange={(e) => setFormData({ ...formData, flightQuestion: e.target.value })}
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder='E.g., "Has flight AA123 on 2024-12-25 arrived more than 3 hours late?"'
                required
                disabled={step !== 'form'}
              />
              <p className="text-xs text-muted mt-1">
                This question will be sent to the Reality Oracle for verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deposit Amount (mUSDT)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1000"
                required
                disabled={step !== 'form'}
              />
              <p className="text-xs text-muted mt-1">
                Total amount to be distributed among buyers if flight is delayed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Insurance Price per Policy (mUSDT)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.insurancePrice}
                onChange={(e) => setFormData({ ...formData, insurancePrice: e.target.value })}
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="10"
                required
                disabled={step !== 'form'}
              />
              <p className="text-xs text-muted mt-1">
                Price each buyer pays for one policy
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Total Policies Available
              </label>
              <input
                type="number"
                value={formData.totalPolicies}
                onChange={(e) => setFormData({ ...formData, totalPolicies: e.target.value })}
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="100"
                required
                disabled={step !== 'form'}
              />
              <p className="text-xs text-muted mt-1">
                Maximum number of policies that can be sold
              </p>
            </div>

            {formData.depositAmount && formData.insurancePrice && formData.totalPolicies && (
              <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Policy Summary:</p>
                <ul className="text-sm space-y-1 text-foreground/80">
                  <li>• Payout per policy: {(parseFloat(formData.depositAmount) / parseFloat(formData.totalPolicies)).toFixed(2)} mUSDT</li>
                  <li>• Total revenue if all sold: {(parseFloat(formData.insurancePrice) * parseFloat(formData.totalPolicies)).toFixed(2)} mUSDT</li>
                  <li>• Your deposit: {formData.depositAmount} mUSDT</li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={step !== 'form' || isApproving || isApprovingConfirming || isCreating || isCreatingConfirming}
              className="w-full px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 disabled:bg-gray-400 transition-colors font-semibold shadow-sm"
            >
              {step === 'approve' && (isApproving || isApprovingConfirming) ? 'Approving mUSDT...' :
               step === 'create' && (isCreating || isCreatingConfirming) ? 'Creating Insurance...' :
               needsApproval ? 'Approve & Create Insurance' : 'Create Insurance'}
            </button>
          </form>

          {(approveError || createError) && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">
                Error: {(approveError || createError)?.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
