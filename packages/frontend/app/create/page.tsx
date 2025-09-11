'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useCreateInsurance, useApproveUSDT, useUSDTAllowance, useUSDTBalance } from '@/hooks/useInsurance'
import { contracts } from '@/lib/config'
import Link from 'next/link'

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export default function CreateInsurance() {
  const { address, isConnected } = useAccount()
  const [formData, setFormData] = useState({
    flightQuestion: '',
    depositAmount: '',
    insurancePrice: '',
    totalPolicies: '',
  })
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
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
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Wallet Connection Required</h2>
            <p className="text-muted">
              Connect your wallet to start creating insurance policies
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
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Policy Created Successfully!</h2>
            <p className="text-muted mb-6">
              Your insurance policy is now live and available for travelers to purchase.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted mb-2">What happens next?</p>
              <ul className="text-sm text-left space-y-1">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Your policy is now visible in the marketplace</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Travelers can purchase coverage for their flights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>You'll earn premiums from each policy sold</span>
                </li>
              </ul>
            </div>
            {hash && (
              <a
                href={`https://baobab.kaiascan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:opacity-90 text-sm mb-6"
              >
                View on Blockchain Explorer
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 transition-colors shadow-sm font-medium"
              >
                Create Another Policy
              </button>
              <Link
                href="/my-policies"
                className="px-6 py-3 border border-[--color-border] text-foreground rounded-full hover:bg-gray-50 transition-colors font-medium"
              >
                View My Policies
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Become an Insurance Provider</h1>
          <p className="text-muted">Create coverage for flights and earn premiums from policy sales</p>
        </div>

        <div className="card p-8">
          {balance !== undefined && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(formatUnits(balance as bigint, 6))} <span className="text-base font-normal text-muted">USDT</span>
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium">
                  Flight Coverage Details
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip('flight')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip === 'flight' && (
                  <div className="absolute left-0 top-8 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    Describe the exact conditions for payout. Be specific about flight number, date, and delay threshold.
                  </div>
                )}
              </div>
              <textarea
                value={formData.flightQuestion}
                onChange={(e) => setFormData({ ...formData, flightQuestion: e.target.value })}
                className="w-full px-4 py-3 border border-[--color-border] rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                rows={3}
                placeholder='Example: "Has flight AA123 from JFK to LAX on December 25, 2024 arrived more than 3 hours late?"'
                required
                disabled={step !== 'form'}
              />
              <p className="text-xs text-muted mt-1">
                This will be verified by independent oracles when determining payouts
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium">
                  Coverage Pool
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip('deposit')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip === 'deposit' && (
                  <div className="absolute left-0 top-8 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    The total amount you're willing to pay out if the flight is delayed. This will be locked in the contract.
                  </div>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">💵</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  className="w-full pl-10 pr-16 py-3 border border-[--color-border] rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="1,000"
                  required
                  disabled={step !== 'form'}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">USDT</span>
              </div>
              <p className="text-xs text-muted mt-1">
                This amount will be distributed equally among all policy buyers if the flight is delayed
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium">
                  Premium per Policy
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip('price')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip === 'price' && (
                  <div className="absolute left-0 top-8 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    The price travelers pay for coverage. Lower prices attract more buyers but reduce your profit margin.
                  </div>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">🏷️</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.insurancePrice}
                  onChange={(e) => setFormData({ ...formData, insurancePrice: e.target.value })}
                  className="w-full pl-10 pr-16 py-3 border border-[--color-border] rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="25"
                  required
                  disabled={step !== 'form'}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">USDT</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Set a competitive price to attract more buyers while maintaining profitability
              </p>
            </div>

            <div className="relative">
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium">
                  Maximum Policies
                </label>
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip('policies')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip === 'policies' && (
                  <div className="absolute left-0 top-8 z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    The maximum number of travelers who can buy this policy. More policies = higher potential revenue but more risk.
                  </div>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">👥</span>
                <input
                  type="number"
                  value={formData.totalPolicies}
                  onChange={(e) => setFormData({ ...formData, totalPolicies: e.target.value })}
                  className="w-full pl-10 pr-20 py-3 border border-[--color-border] rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="100"
                  required
                  disabled={step !== 'form'}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">policies</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Limit the number of policies to manage your maximum exposure
              </p>
            </div>

            {formData.depositAmount && formData.insurancePrice && formData.totalPolicies && (
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Financial Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1">Payout per Policy</p>
                    <p className="font-bold text-lg">
                      {formatNumber((parseFloat(formData.depositAmount) / parseFloat(formData.totalPolicies)).toFixed(2))}
                      <span className="text-xs font-normal text-muted ml-1">USDT</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Maximum Revenue</p>
                    <p className="font-bold text-lg text-primary">
                      {formatNumber((parseFloat(formData.insurancePrice) * parseFloat(formData.totalPolicies)).toFixed(2))}
                      <span className="text-xs font-normal text-muted ml-1">USDT</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Coverage Pool</p>
                    <p className="font-semibold">
                      {formatNumber(formData.depositAmount)}
                      <span className="text-xs font-normal text-muted ml-1">USDT</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Profit Margin</p>
                    <p className="font-semibold text-primary">
                      {(
                        ((parseFloat(formData.insurancePrice) * parseFloat(formData.totalPolicies) - parseFloat(formData.depositAmount)) /
                          parseFloat(formData.depositAmount)) *
                        100
                      ).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-primary-200">
                  <p className="text-xs text-muted">
                    <strong>Risk Assessment:</strong> You'll earn premiums if the flight is on time, but pay out if it's delayed.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={step !== 'form' || isApproving || isApprovingConfirming || isCreating || isCreatingConfirming}
              className="w-full px-6 py-3 bg-primary text-white rounded-full hover:opacity-90 disabled:bg-gray-400 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              {step === 'approve' && (isApproving || isApprovingConfirming) ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving Token Spend...
                </span>
              ) : step === 'create' && (isCreating || isCreatingConfirming) ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Policy...
                </span>
              ) : needsApproval ? (
                'Approve & Create Policy'
              ) : (
                'Create Policy'
              )}
            </button>
          </form>

          {(approveError || createError) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-700 text-sm font-medium">Transaction Failed</p>
                  <p className="text-red-600 text-xs mt-1">{(approveError || createError)?.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}