'use client';

/**
 * LIFF Optimized Layout Components
 * Responsive layouts designed for LINE app environment
 */

import React, { useEffect, useState } from 'react';
import liff from '@line/liff';

interface LiffLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  className?: string;
}

/**
 * Main LIFF Layout Container
 * Handles safe areas and responsive sizing
 */
export const LiffLayout: React.FC<LiffLayoutProps> = ({
  children,
  title,
  showHeader = true,
  showBottomNav = false,
  className = '',
}) => {
  const [liffSize, setLiffSize] = useState<'compact' | 'tall' | 'full'>('full');
  const [isInClient, setIsInClient] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    // Check LIFF environment
    if (liff.isInitialized()) {
      setIsInClient(liff.isInClient());

      // Get LIFF app size from context
      liff.ready.then(() => {
        const context = liff.getContext();
        if (context?.liffId) {
          // Determine size based on viewport
          const height = window.innerHeight;
          const screenHeight = window.screen.height;
          const ratio = height / screenHeight;

          if (ratio < 0.6) {
            setLiffSize('compact');
          } else if (ratio < 0.85) {
            setLiffSize('tall');
          } else {
            setLiffSize('full');
          }
        }
      });
    }

    // Handle viewport height for mobile browsers
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <div
      className={`liff-app liff-${liffSize} ${className}`}
      style={{ minHeight: viewportHeight }}
    >
      <div className="liff-safe-area flex flex-col h-full">
        {showHeader && (
          <LiffHeader title={title} isInClient={isInClient} />
        )}

        <main className="liff-content flex-1 overflow-y-auto">
          {children}
        </main>

        {showBottomNav && (
          <LiffBottomNav />
        )}
      </div>
    </div>
  );
};

/**
 * LIFF Header Component
 * Native LINE app header style
 */
export const LiffHeader: React.FC<{
  title?: string;
  isInClient?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}> = ({ title = 'LIFF App', isInClient = false, onBack, rightAction }) => {
  const handleClose = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="liff-header">
      <div className="flex items-center justify-between">
        <div className="w-12">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        <h1 className="liff-header-title flex-1 text-center">
          {title}
        </h1>

        <div className="w-12 text-right">
          {rightAction || (
            isInClient && (
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * LIFF Bottom Navigation
 * Fixed bottom navigation bar
 */
export const LiffBottomNav: React.FC<{
  items?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
  }>;
}> = ({ items }) => {
  const defaultItems = items || [
    {
      icon: <HomeIcon />,
      label: 'Home',
      onClick: () => console.log('Home'),
      active: true,
    },
    {
      icon: <WalletIcon />,
      label: 'Wallet',
      onClick: () => console.log('Wallet'),
    },
    {
      icon: <ProfileIcon />,
      label: 'Profile',
      onClick: () => console.log('Profile'),
    },
  ];

  return (
    <nav className="liff-bottom-nav">
      {defaultItems.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          className={`flex-1 flex flex-col items-center gap-1 py-2 ${
            item.active ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          <div className="w-6 h-6">{item.icon}</div>
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

/**
 * LIFF Card Component
 * LINE-styled card container
 */
export const LiffCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`liff-card ${onClick ? 'cursor-pointer active:scale-98' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * LIFF Button Component
 * Native LINE button styles
 */
export const LiffButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`
        liff-button
        liff-button-${variant}
        ${fullWidth ? 'liff-button-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <span className="liff-spinner mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * LIFF List Component
 * Native LINE list style
 */
export const LiffList: React.FC<{
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onClick?: () => void;
  }>;
  className?: string;
}> = ({ items, className = '' }) => {
  return (
    <div className={`liff-list ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`liff-list-item ${item.onClick ? 'cursor-pointer' : ''}`}
          onClick={item.onClick}
        >
          {item.icon && (
            <div className="mr-3 text-gray-600">{item.icon}</div>
          )}

          <div className="flex-1">
            <div className="text-gray-900 font-medium">{item.title}</div>
            {item.subtitle && (
              <div className="text-sm text-gray-500 mt-0.5">
                {item.subtitle}
              </div>
            )}
          </div>

          {item.rightContent || (
            item.onClick && (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-400"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * LIFF Input Component
 * Native LINE input style
 */
export const LiffInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`liff-input ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * LIFF Loading Skeleton
 * Shows loading placeholder
 */
export const LiffSkeleton: React.FC<{
  height?: string;
  width?: string;
  className?: string;
}> = ({ height = '20px', width = '100%', className = '' }) => {
  return (
    <div
      className={`liff-skeleton ${className}`}
      style={{ height, width }}
    />
  );
};

/**
 * LIFF Toast Component
 * Shows temporary notifications
 */
export const LiffToast: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-800',
  }[type];

  return (
    <div className={`liff-toast ${bgColor}`}>
      {message}
    </div>
  );
};

// Icon Components
const HomeIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const WalletIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
  </svg>
);

const ProfileIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />
  </svg>
);