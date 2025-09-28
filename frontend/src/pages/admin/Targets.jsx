import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminTargets = () => {
  const { user, logout } = useAuth();
  const [targetsList, setTargetsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    target_amount: '',
    target_period: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  useEffect(() => {
    fetchTargetsData();
    fetchStaffList();
  }, []);

  const fetchTargetsData = async () => {
    try {
      const data = await apiService.getTargetsList();
      setTargetsList(data);
    } catch (error) {
      console.error('Failed to fetch targets data:', error);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    try {
      await apiService.createTarget(formData);
      setShowAddForm(false);
      setFormData({
        staff_id: '',
        target_amount: '',
        target_period: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      fetchTargetsData();
    } catch (error) {
      console.error('Failed to add target:', error);
    }
  };

  const handleEditTarget = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateTarget(editingTarget.id, formData);
      setEditingTarget(null);
      setFormData({
        staff_id: '',
        target_amount: '',
        target_period: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      fetchTargetsData();
    } catch (error) {
      console.error('Failed to update target:', error);
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (window.confirm('Are you sure you want to delete this target?')) {
      try {
        await apiService.deleteTarget(targetId);
        fetchTargetsData();
      } catch (error) {
        console.error('Failed to delete target:', error);
      }
    }
  };

  const openEditForm = (target) => {
    setEditingTarget(target);
    setFormData({
      staff_id: target.staff_id,
      target_amount: target.target_amount,
      target_period: target.target_period,
      start_date: target.start_date,
      end_date: target.end_date,
      description: target.description || ''
    });
  };

  const getTargetStatus = (target) => {
    const now = new Date();
    const startDate = new Date(target.start_date);
    const endDate = new Date(target.end_date);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading targets data..." />;
  }

  const tableColumns = [
    {
      key: 'staff_name',
      header: 'Staff Name',
      render: (value) => value
    },
    {
      key: 'target_amount',
      header: 'Target Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'target_period',
      header: 'Period',
      render: (value) => value
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'end_date',
      header: 'End Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, item) => {
        const status = getTargetStatus(item);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Target Management</h1>
              <p className="text-sm text-gray-600">Set and manage sales targets for staff members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Add Target Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Targets ({targetsList.length})</h2>
              <p className="text-sm text-gray-500">Set and manage sales targets for your team</p>
            </div>
            <MobileButton
              onClick={() => setShowAddForm(true)}
              variant="primary"
              size="md"
            >
              Add New Target
            </MobileButton>
          </div>

          {/* Targets Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Targets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {targetsList.filter(target => getTargetStatus(target) === 'active').length}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Target Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{targetsList.reduce((total, target) => total + target.target_amount, 0).toLocaleString()}
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
                  <p className="text-sm font-medium text-gray-500">Completed Targets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {targetsList.filter(target => getTargetStatus(target) === 'completed').length}
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Targets List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Targets List</h3>
            </div>
            
            <div className="p-6">
              {targetsList.length > 0 ? (
                <MobileTable
                  data={targetsList}
                  columns={tableColumns}
                  actions={[
                    {
                      label: 'Edit',
                      onClick: (item) => openEditForm(item),
                      variant: 'primary',
                      size: 'sm'
                    },
                    {
                      label: 'Delete',
                      onClick: (item) => handleDeleteTarget(item.id),
                      variant: 'danger',
                      size: 'sm'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No targets found</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Add Target Modal */}
      <MobileModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Target"
      >
        <form onSubmit={handleAddTarget} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                name="staff_id"
                value={formData.staff_id}
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
              label="Target Amount"
              name="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={handleInputChange}
              required
              placeholder="100000"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Period</label>
              <select
                name="target_period"
                value={formData.target_period}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Period</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <MobileInput
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Target description (optional)"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setShowAddForm(false)}
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
              Add Target
            </MobileButton>
          </div>
        </form>
      </MobileModal>

      {/* Edit Target Modal */}
      <MobileModal
        isOpen={!!editingTarget}
        onClose={() => setEditingTarget(null)}
        title="Edit Target"
      >
        <form onSubmit={handleEditTarget} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                name="staff_id"
                value={formData.staff_id}
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
              label="Target Amount"
              name="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={handleInputChange}
              required
              placeholder="100000"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Period</label>
              <select
                name="target_period"
                value={formData.target_period}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Period</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <MobileInput
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Target description (optional)"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setEditingTarget(null)}
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
              Update Target
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminTargets;