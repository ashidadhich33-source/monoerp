import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminSalary = () => {
  const { user, logout } = useAuth();
  const [salaryList, setSalaryList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showBulkProcess, setShowBulkProcess] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceFormData, setAdvanceFormData] = useState({
    staff_id: '',
    advance_amount: '',
    deduction_periods: '',
    reason: ''
  });

  useEffect(() => {
    fetchSalaryData();
    fetchStaffList();
  }, [selectedMonth]);

  const fetchSalaryData = async () => {
    try {
      const data = await apiService.getSalaryList(selectedMonth);
      setSalaryList(data);
    } catch (error) {
      console.error('Failed to fetch salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const data = await apiService.getStaffList();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    }
  };

  const handleApproveSalary = async (salaryId) => {
    try {
      await apiService.approveSalary(salaryId);
      fetchSalaryData();
    } catch (error) {
      console.error('Failed to approve salary:', error);
    }
  };

  const handleRejectSalary = async (salaryId) => {
    try {
      await apiService.rejectSalary(salaryId);
      fetchSalaryData();
    } catch (error) {
      console.error('Failed to reject salary:', error);
    }
  };

  const handleBulkApprove = async () => {
    try {
      await apiService.bulkApproveSalary(selectedMonth);
      fetchSalaryData();
      setShowBulkProcess(false);
    } catch (error) {
      console.error('Failed to bulk approve salaries:', error);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    try {
      await apiService.addAdvance(advanceFormData);
      setShowAdvanceForm(false);
      setAdvanceFormData({
        staff_id: '',
        advance_amount: '',
        deduction_periods: '',
        reason: ''
      });
      fetchSalaryData();
    } catch (error) {
      console.error('Failed to add advance:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdvanceFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading salary data..." />;
  }

  const tableColumns = [
    {
      key: 'staff_name',
      header: 'Staff Name',
      render: (value) => value
    },
    {
      key: 'basic_salary',
      header: 'Basic Salary',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'net_salary',
      header: 'Net Salary',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.toUpperCase()}
        </span>
      )
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not paid'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
              <p className="text-sm text-gray-600">Manage staff salaries and approve payments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Month Selection and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <MobileInput
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
              />
              <MobileButton
                onClick={fetchSalaryData}
                variant="secondary"
                size="md"
              >
                Refresh
              </MobileButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <MobileButton
                onClick={() => setShowBulkProcess(true)}
                variant="primary"
                size="md"
              >
                Bulk Approve
              </MobileButton>
              <MobileButton
                onClick={() => setShowAdvanceForm(true)}
                variant="secondary"
                size="md"
              >
                Add Advance
              </MobileButton>
            </div>
          </div>

          {/* Salary Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Salaries</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{salaryList.reduce((total, salary) => total + salary.net_salary, 0).toLocaleString()}
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
                  <p className="text-sm font-medium text-gray-500">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salaryList.filter(salary => salary.payment_status === 'paid').length}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salaryList.filter(salary => salary.payment_status === 'pending').length}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salaryList.filter(salary => salary.payment_status === 'approved').length}
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Salary List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Salary Records for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            
            <div className="p-6">
              {salaryList.length > 0 ? (
                <MobileTable
                  data={salaryList}
                  columns={tableColumns}
                  actions={[
                    {
                      label: 'Approve',
                      onClick: (item) => handleApproveSalary(item.id),
                      variant: 'success',
                      size: 'sm',
                      condition: (item) => item.payment_status === 'pending'
                    },
                    {
                      label: 'Reject',
                      onClick: (item) => handleRejectSalary(item.id),
                      variant: 'danger',
                      size: 'sm',
                      condition: (item) => item.payment_status === 'pending'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No salary records found for this month</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Bulk Process Modal */}
      <MobileModal
        isOpen={showBulkProcess}
        onClose={() => setShowBulkProcess(false)}
        title="Bulk Approve Salaries"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will approve all pending salaries for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
            Are you sure you want to continue?
          </p>
          <div className="flex justify-end space-x-3">
            <MobileButton
              onClick={() => setShowBulkProcess(false)}
              variant="secondary"
              size="md"
            >
              Cancel
            </MobileButton>
            <MobileButton
              onClick={handleBulkApprove}
              variant="primary"
              size="md"
            >
              Approve All
            </MobileButton>
          </div>
        </div>
      </MobileModal>

      {/* Add Advance Modal */}
      <MobileModal
        isOpen={showAdvanceForm}
        onClose={() => setShowAdvanceForm(false)}
        title="Add Advance Payment"
      >
        <form onSubmit={handleAddAdvance} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                name="staff_id"
                value={advanceFormData.staff_id}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Staff Member</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <MobileInput
              label="Advance Amount"
              name="advance_amount"
              type="number"
              value={advanceFormData.advance_amount}
              onChange={handleInputChange}
              required
              placeholder="5000"
            />
            <MobileInput
              label="Deduction Periods"
              name="deduction_periods"
              type="number"
              value={advanceFormData.deduction_periods}
              onChange={handleInputChange}
              required
              placeholder="3"
            />
            <MobileInput
              label="Reason"
              name="reason"
              value={advanceFormData.reason}
              onChange={handleInputChange}
              required
              placeholder="Emergency advance"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setShowAdvanceForm(false)}
              variant="secondary"
              size="md"
            >
              Cancel
            </MobileButton>
            <MobileButton
              type="submit"
              variant="primary"
              size="md"
            >
              Add Advance
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminSalary;