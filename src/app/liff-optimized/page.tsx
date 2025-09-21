'use client';

/**
 * LIFF Optimized Demo Page
 * Demonstrates best practices for LIFF UI/UX and testing
 */

import React, { useState, useEffect } from 'react';
import {
  LiffLayout,
  LiffCard,
  LiffButton,
  LiffList,
  LiffInput,
  LiffSkeleton,
  LiffToast,
} from '@/components/liff/LiffOptimizedLayout';
import { initializeLiff } from '@/services/liff/liffInitializer';
import { getUserProfile } from '@/services/liff/authService';
import {
  testLiffInit,
  generateLiffUrl,
  generateQRCodeUrl,
  diagnoseLiffError,
  initLiffTesting,
} from '@/utils/liffTesting';
import type { Profile } from '@line/liff';

// Import CSS
import '@/styles/liff-design-system.css';

export default function LiffOptimizedDemo() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize testing utilities in development
        if (process.env.NODE_ENV === 'development') {
          await initLiffTesting({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
            debugMode: debugMode,
            logLevel: 'debug',
          });
        }

        // Initialize LIFF
        await initializeLiff();

        // Run tests
        const results = await testLiffInit();
        setTestResults(results);

        // Get user profile if logged in
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        const diagnosis = diagnoseLiffError(error as Error);
        console.log('Diagnosis:', diagnosis);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [debugMode]);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Form submitted successfully!');
    console.log('Form data:', formData);
  };

  const listItems = [
    {
      id: '1',
      title: 'LIFF Version',
      subtitle: testResults?.details?.liffVersion || 'Loading...',
      icon: <InfoIcon />,
    },
    {
      id: '2',
      title: 'Environment',
      subtitle: testResults?.details?.isInClient ? 'LINE App' : 'External Browser',
      icon: <DeviceIcon />,
    },
    {
      id: '3',
      title: 'Login Status',
      subtitle: testResults?.details?.isLoggedIn ? 'Logged In' : 'Not Logged In',
      icon: <UserIcon />,
      rightContent: (
        <span className={`liff-badge ${testResults?.details?.isLoggedIn ? 'liff-badge-success' : 'liff-badge-warning'}`}>
          {testResults?.details?.isLoggedIn ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: '4',
      title: 'Platform',
      subtitle: testResults?.details?.os || 'Unknown',
      icon: <PlatformIcon />,
    },
  ];

  const actionItems = [
    {
      id: 'share',
      title: 'Share to Friends',
      subtitle: 'Send this app to LINE friends',
      icon: <ShareIcon />,
      onClick: async () => {
        try {
          const liff = (await import('@line/liff')).default;
          if (liff.isApiAvailable('shareTargetPicker')) {
            await liff.shareTargetPicker([
              {
                type: 'text',
                text: 'Check out this LIFF app!',
              },
            ]);
            showNotification('Shared successfully!');
          } else {
            showNotification('Share API not available');
          }
        } catch (error) {
          console.error('Share error:', error);
          showNotification('Failed to share');
        }
      },
    },
    {
      id: 'scan',
      title: 'Scan QR Code',
      subtitle: 'Scan QR codes with LINE',
      icon: <QRIcon />,
      onClick: async () => {
        try {
          const liff = (await import('@line/liff')).default;
          if (liff.isApiAvailable('scanCodeV2')) {
            const result = await liff.scanCodeV2();
            showNotification(`Scanned: ${result.value}`);
          } else {
            showNotification('QR scanner not available');
          }
        } catch (error) {
          console.error('Scan error:', error);
          showNotification('Failed to scan');
        }
      },
    },
  ];

  // Generate LIFF URL and QR code
  const liffUrl = generateLiffUrl(
    process.env.NEXT_PUBLIC_LIFF_ID || '',
    '/liff-optimized'
  );
  const qrCodeUrl = generateQRCodeUrl(liffUrl);

  return (
    <LiffLayout
      title="LIFF Optimized Demo"
      showHeader={true}
      showBottomNav={true}
    >
      <div className="space-y-4">
        {/* Loading State */}
        {isInitializing ? (
          <>
            <LiffCard>
              <LiffSkeleton height="60px" />
            </LiffCard>
            <LiffCard>
              <LiffSkeleton height="40px" />
              <div className="mt-2">
                <LiffSkeleton height="20px" width="60%" />
              </div>
            </LiffCard>
          </>
        ) : (
          <>
            {/* User Profile Card */}
            {profile && (
              <LiffCard>
                <div className="flex items-center space-x-4">
                  {profile.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {profile.displayName}
                    </h2>
                    {profile.statusMessage && (
                      <p className="text-sm text-gray-600">
                        {profile.statusMessage}
                      </p>
                    )}
                  </div>
                </div>
              </LiffCard>
            )}

            {/* Environment Info */}
            <LiffCard>
              <h3 className="text-lg font-semibold mb-3">LIFF Environment</h3>
              <LiffList items={listItems} />
            </LiffCard>

            {/* Actions */}
            <LiffCard>
              <h3 className="text-lg font-semibold mb-3">LIFF Features</h3>
              <LiffList items={actionItems} />
            </LiffCard>

            {/* Form Example */}
            <LiffCard>
              <h3 className="text-lg font-semibold mb-3">Contact Form</h3>
              <form onSubmit={handleSubmit}>
                <LiffInput
                  label="Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                  required
                />

                <LiffInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your.email@example.com"
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="liff-input"
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Enter your message"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <LiffButton type="submit" variant="primary" fullWidth>
                    Submit
                  </LiffButton>
                  <LiffButton
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() =>
                      setFormData({ name: '', email: '', message: '' })
                    }
                  >
                    Clear
                  </LiffButton>
                </div>
              </form>
            </LiffCard>

            {/* Testing Info */}
            <LiffCard>
              <h3 className="text-lg font-semibold mb-3">Testing Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">LIFF URL:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                    {liffUrl}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">QR Code:</p>
                  <img
                    src={qrCodeUrl}
                    alt="LIFF QR Code"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Scan with LINE to open this LIFF app
                  </p>
                </div>

                <div className="pt-3 border-t">
                  <LiffButton
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setDebugMode(!debugMode);
                      showNotification(
                        `Debug mode ${!debugMode ? 'enabled' : 'disabled'}`
                      );
                    }}
                  >
                    {debugMode ? 'Disable' : 'Enable'} Debug Mode
                  </LiffButton>
                </div>
              </div>
            </LiffCard>

            {/* Test Results (Development Only) */}
            {process.env.NODE_ENV === 'development' && testResults && (
              <LiffCard>
                <h3 className="text-lg font-semibold mb-3">Test Results</h3>
                <div className="bg-gray-50 rounded p-3">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(testResults.details, null, 2)}
                  </pre>
                </div>
              </LiffCard>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <LiffToast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </LiffLayout>
  );
}

// Icon Components
const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

const DeviceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
  </svg>
);

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const PlatformIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
  </svg>
);

const QRIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 11h2v2H3zm0-4h2v2H3zm0 8h2v2H3zm4-8h2v2H7zm0 4h2v2H7zm0 4h2v2H7zm4-12h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-16h2v2h-2zm0 8h2v2h-2zm0 8h2v2h-2zm4-16h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z" />
  </svg>
);