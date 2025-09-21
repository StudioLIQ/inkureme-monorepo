'use client';

/**
 * User Profile Display Component
 * Shows logged-in user's LINE profile information
 */

import React, { useEffect, useState } from 'react';
import type { Profile } from '@line/liff';
import { getUserProfile, logoutUser } from '@/services/liff/authService';

interface UserProfileDisplayProps {
  variant?: 'full' | 'compact' | 'dropdown';
  showLogoutButton?: boolean;
  onLogout?: () => void;
  className?: string;
}

export const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({
  variant = 'full',
  showLogoutButton = true,
  onLogout,
  className = '',
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setProfile(null);
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Full variant - Card style
  if (variant === 'full') {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {profile.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.displayName}
              </h3>
              <p className="text-sm text-gray-500">LINE User</p>
              {profile.statusMessage && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  "{profile.statusMessage}"
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                ID: {profile.userId.substring(0, 8)}...
              </p>
            </div>
          </div>
          {showLogoutButton && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - Inline style
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {profile.pictureUrl ? (
          <img
            src={profile.pictureUrl}
            alt={profile.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">
          {profile.displayName}
        </span>
        {showLogoutButton && (
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 transition"
          >
            Logout
          </button>
        )}
      </div>
    );
  }

  // Dropdown variant - For headers/navbars
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition"
        >
          {profile.pictureUrl ? (
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 hidden sm:block">
            {profile.displayName}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {profile.pictureUrl ? (
                  <img
                    src={profile.pictureUrl}
                    alt={profile.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-lg font-bold">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile.displayName}
                  </p>
                  <p className="text-xs text-gray-500">LINE Account</p>
                  {profile.statusMessage && (
                    <p className="text-xs text-gray-600 mt-1 italic truncate">
                      {profile.statusMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile.userId);
                  alert('User ID copied to clipboard!');
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
              >
                Copy User ID
              </button>
              {showLogoutButton && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

/**
 * User Avatar Component
 * Simple avatar display without dropdown
 */
export const UserAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}> = ({ size = 'md', showName = false, className = '' }) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile) return null;

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {profile.pictureUrl ? (
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold`}
        >
          {profile.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {showName && (
        <span className="text-sm font-medium text-gray-900">
          {profile.displayName}
        </span>
      )}
    </div>
  );
};