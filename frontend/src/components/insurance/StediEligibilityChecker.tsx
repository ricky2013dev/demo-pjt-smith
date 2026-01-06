import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import { stediService, type Subscriber, type Provider, type DentalBenefitsResponse } from '@/services/stediService';

const StediEligibilityChecker: React.FC = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DentalBenefitsResponse | null>(null);

  // Form state for subscriber
  const [subscriberMemberId, setSubscriberMemberId] = useState('0000000000');
  const [subscriberFirstName, setSubscriberFirstName] = useState('John');
  const [subscriberLastName, setSubscriberLastName] = useState('Doe');
  const [subscriberDOB, setSubscriberDOB] = useState('1987-05-21');

  // Form state for provider
  const [providerNPI, setProviderNPI] = useState('1234567890');
  const [providerOrgName, setProviderOrgName] = useState('Smith Dental Clinic');

  const handleLogout = () => {
    navigate('/');
  };

  const sampleDatasets = [
    {
      name: 'Sample 1 (CIGNA)',
      memberId: '0000000000',
      firstName: 'John',
      lastName: 'Doe',
      dob: '1987-05-21',
      npi: '1234567890',
      orgName: 'Smith Dental Clinic'
    },
    {
      name: 'Sample 2 (CIGNA)',
      memberId: '0000000000',
      firstName: 'John',
      lastName: 'Doe',
      dob: '1987-05-21',
      npi: '9876543210',
      orgName: 'Premier Dental Group'
    },
    {
      name: 'Sample 3 (CIGNA)',
      memberId: '0000000000',
      firstName: 'John',
      lastName: 'Doe',
      dob: '1987-05-21',
      npi: '1111111111',
      orgName: 'Bright Smile Dentistry'
    }
  ];

  const loadSampleData = (index: number) => {
    const sample = sampleDatasets[index];
    setSubscriberMemberId(sample.memberId);
    setSubscriberFirstName(sample.firstName);
    setSubscriberLastName(sample.lastName);
    setSubscriberDOB(sample.dob);
    setProviderNPI(sample.npi);
    setProviderOrgName(sample.orgName);
    setResults(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const subscriber: Subscriber = {
        memberId: subscriberMemberId,
        firstName: subscriberFirstName,
        lastName: subscriberLastName,
        dateOfBirth: subscriberDOB,
      };

      const provider: Provider = {
        npi: providerNPI,
        organizationName: providerOrgName,
      };

      const response = await stediService.checkDentalBenefits(subscriber, provider);
      setResults(response);
    } catch (err: any) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubscriberMemberId('');
    setSubscriberFirstName('');
    setSubscriberLastName('');
    setSubscriberDOB('');
    setProviderNPI('');
    setProviderOrgName('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onLogoClick={() => navigate('/insurance/dashboard')}
        onLogout={handleLogout}
        mode="insurance"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/insurance/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Stedi Dental Eligibility Checker</h1>
          <p className="text-gray-600 mt-2">Check dental insurance eligibility and benefits using Stedi API</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Patient & Provider Information</h2>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-gray-700 mb-3 font-medium">Quick Test Data:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleDatasets.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadSampleData(idx)}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-md transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subscriber Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800">Subscriber Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member ID *
                    </label>
                    <input
                      type="text"
                      value={subscriberMemberId}
                      onChange={(e) => setSubscriberMemberId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="e.g., ABC123456789"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={subscriberFirstName}
                        onChange={(e) => setSubscriberFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={subscriberLastName}
                        onChange={(e) => setSubscriberLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={subscriberDOB}
                      onChange={(e) => setSubscriberDOB(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-800">Provider Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider NPI *
                    </label>
                    <input
                      type="text"
                      value={providerNPI}
                      onChange={(e) => setProviderNPI(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="e.g., 1234567890"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={providerOrgName}
                      onChange={(e) => setProviderOrgName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Smith Dental Clinic"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Eligibility Results</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loading && !error && !results && (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">Fill out the form and click "Check Eligibility" to see results</p>
              </div>
            )}

            {results && results.success && results.data && (
              <div className="space-y-6">
                {/* General Coverage */}
                <div>
                  <h3 className="text-lg font-medium mb-2 text-green-700">General Dental Coverage</h3>
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <pre className="text-sm text-gray-700 overflow-auto max-h-48">
                      {JSON.stringify(results.data.general, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Procedure Benefits */}
                <div>
                  <h3 className="text-lg font-medium mb-2 text-blue-700">Procedure-Specific Benefits</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.data.procedures.map((proc, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{proc.code}</p>
                            <p className="text-sm text-gray-600">{proc.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Category: {proc.category}</p>
                          </div>
                          <div className="ml-4">
                            {proc.benefit === "Covered in STC 35" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Covered
                              </span>
                            ) : proc.benefit ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Check Details
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Not Covered
                              </span>
                            )}
                          </div>
                        </div>
                        {proc.benefit && proc.benefit !== "Covered in STC 35" && (
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(proc.benefit, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StediEligibilityChecker;
