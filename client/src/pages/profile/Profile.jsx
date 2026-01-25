import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { googleAuthAPI } from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  console.log(user)

  // Get initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };


    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gmail_connected') === 'true') {
        alert('Gmail account connected successfully!');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }, []);

    const handleConnectClick = async () => {
      try {
        const data = await googleAuthAPI.getAuthUrl();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        }
      } catch (error) {
        console.error('Error connecting to Gmail:', error);
        alert('Failed to connect to Gmail. Please try again.');
      }
    };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-700">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-white">
                User Profile
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                Personal details and account information.
              </p>
            </div>
            <div className="shrink-0">
               <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-gray-600">
                  {getInitials(user?.full_name || user?.email)}
               </div>
            </div>
          </div>
          <div className="border-t border-gray-700">
            <dl>
              <div className="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">
                  Full name
                </dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {user?.full_name || 'N/A'}
                </dd>
              </div>
              <div className="bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>
              <div className="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">
                  Account Status
                </dt>
                <dd className="mt-1 text-sm text-green-400 sm:mt-0 sm:col-span-2 flex items-center">
                  <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                  Active
                </dd>
              </div>
               {/* Placeholder for future settings */}
               <div className="bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">
                  Settings
                </dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  <button className="font-medium text-indigo-400 hover:text-indigo-300">
                    Change Password
                  </button>
                </dd>
              </div>
              <div className="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">
                    Connect Gmail
                </dt>
                <div className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                    <button 
                    disabled={!!user?.is_gmail_connected}
                    onClick={handleConnectClick}
                    className="font-medium cursor-pointer text-indigo-400 disabled:cursor-not-allowed disabled:text-gray-500 hover:text-indigo-300">
                        {user?.is_gmail_connected ? 'Gmail Connected' : 'Connect Account'}
                    </button>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
