import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileLoading from '../../components/MobileLoading';

const StaffSalary = () => {
  const { user, logout } = useAuth();
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historicalSalaries, setHistoricalSalaries] = useState([]);

  useEffect(() => {
    fetchSalaryDetails();
    fetchHistoricalSalaries();
  }, [selectedMonth]);

  const fetchSalaryDetails = async () => {
    try {
      const data = await apiService.getSalaryDetails(selectedMonth);
      setSalaryDetails(data);
    } catch (error) {
      console.error('Failed to fetch salary details:', error);
      setSalaryDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalSalaries = async () => {
    try {
      // This would need a new API endpoint for historical salaries
      // For now, we'll simulate the data
      setHistoricalSalaries([]);
    } catch (error) {
      console.error('Failed to fetch historical salaries:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const downloadSalarySlip = async () => {
    try {
      // This would need a new API endpoint for downloading salary slips
      // Downloading salary slip for: selectedMonth
    } catch (error) {
      console.error('Failed to download salary slip:', error);
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading salary details..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salary Details</h1>
              <p className="text-sm text-gray-600">View your salary breakdown and payment status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Month Selection */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Month
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <MobileInput
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1"
              />
              <MobileButton
                onClick={fetchSalaryDetails}
                variant="primary"
                size="md"
              >
                View Details
              </MobileButton>
            </div>
          </MobileCard>

          {salaryDetails ? (
            <>
              {/* Salary Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MobileCard className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Gross Salary</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(salaryDetails.gross_salary)}
                      </p>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Net Salary</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(salaryDetails.net_salary)}
                      </p>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Incentives</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(salaryDetails.target_incentive + salaryDetails.basic_incentive)}
                      </p>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(salaryDetails.payment_status)}`}>
                        {salaryDetails.payment_status.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-sm text-gray-900">
                        {salaryDetails.payment_date ? new Date(salaryDetails.payment_date).toLocaleDateString() : 'Not paid'}
                      </p>
                    </div>
                  </div>
                </MobileCard>
              </div>

              {/* Download Salary Slip */}
              <MobileCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Salary Slip</h3>
                    <p className="text-sm text-gray-500">Download your salary slip for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                  <MobileButton
                    onClick={downloadSalarySlip}
                    variant="primary"
                    size="md"
                  >
                    Download PDF
                  </MobileButton>
                </div>
              </MobileCard>

              {/* Detailed Salary Breakdown */}
              <MobileCard className="p-0">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Salary Breakdown for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Detailed breakdown of your salary components
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Basic Salary</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(salaryDetails.basic_salary)}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Working Days</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {salaryDetails.present_days} / {salaryDetails.working_days} days
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Salary for Days</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(salaryDetails.salary_for_days)}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Sunday Count</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {salaryDetails.sunday_count} Sundays
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Target Incentive</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(salaryDetails.target_incentive)}
                    </dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Basic Incentive</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(salaryDetails.basic_incentive)}
                    </dd>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Advance Deduction</dt>
                    <dd className="mt-1 text-sm text-red-600 sm:mt-0 sm:col-span-2">
                      -{formatCurrency(salaryDetails.advance_deduction)}
                    </dd>
                  </div>
                  
                  <div className="bg-blue-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-blue-900">Net Salary</dt>
                    <dd className="mt-1 text-lg font-bold text-blue-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(salaryDetails.net_salary)}
                    </dd>
                  </div>
                </div>
              </MobileCard>

              {/* Historical Salary Slips */}
              <MobileCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Salary Slips</h3>
                {historicalSalaries.length > 0 ? (
                  <div className="space-y-3">
                    {historicalSalaries.map((salary, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{salary.month_year}</p>
                          <p className="text-sm text-gray-500">Status: {salary.payment_status}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            ₹{salary.net_salary.toLocaleString()}
                          </span>
                          <MobileButton
                            onClick={() => downloadSalarySlip()}
                            variant="outline"
                            size="sm"
                          >
                            Download
                          </MobileButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No historical salary records available</p>
                )}
              </MobileCard>
            </>
          ) : (
            <MobileCard className="p-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No salary record found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No salary record found for the selected month. Please contact HR for more information.
                </p>
              </div>
            </MobileCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffSalary;