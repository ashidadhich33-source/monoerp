import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminStaff = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    email: '',
    phone: '',
    basic_salary: '',
    incentive_percentage: '',
    department: '',
    joining_date: '',
    password: ''
  });

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const data = await apiService.getStaffList();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await apiService.createStaff(formData);
      setShowAddForm(false);
      setFormData({
        employee_code: '',
        name: '',
        email: '',
        phone: '',
        basic_salary: '',
        incentive_percentage: '',
        department: '',
        joining_date: '',
        password: ''
      });
      fetchStaffList();
    } catch (error) {
      console.error('Failed to add staff:', error);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateStaff(editingStaff.id, formData);
      setEditingStaff(null);
      setFormData({
        employee_code: '',
        name: '',
        email: '',
        phone: '',
        basic_salary: '',
        incentive_percentage: '',
        department: '',
        joining_date: '',
        password: ''
      });
      fetchStaffList();
    } catch (error) {
      console.error('Failed to update staff:', error);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await apiService.deleteStaff(staffId);
        fetchStaffList();
      } catch (error) {
        console.error('Failed to delete staff:', error);
      }
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await apiService.updateStaffStatus(staffId, !currentStatus);
      fetchStaffList();
    } catch (error) {
      console.error('Failed to update staff status:', error);
    }
  };

  const openEditForm = (staff) => {
    setEditingStaff(staff);
    setFormData({
      employee_code: staff.employee_code,
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      basic_salary: staff.basic_salary,
      incentive_percentage: staff.incentive_percentage,
      department: staff.department || '',
      joining_date: staff.joining_date,
      password: ''
    });
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading staff list..." />;
  }

  const tableColumns = [
    {
      key: 'employee_code',
      header: 'Employee Code',
      render: (value) => value
    },
    {
      key: 'name',
      header: 'Name',
      render: (value) => value
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => value
    },
    {
      key: 'department',
      header: 'Department',
      render: (value) => value || 'N/A'
    },
    {
      key: 'basic_salary',
      header: 'Basic Salary',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-600">Manage staff members and their details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Add Staff Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Staff Members ({staffList.length})</h2>
              <p className="text-sm text-gray-500">Manage all staff members in the system</p>
            </div>
            <MobileButton
              onClick={() => setShowAddForm(true)}
              variant="primary"
              size="md"
            >
              Add New Staff
            </MobileButton>
          </div>

          {/* Staff List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Staff List</h3>
            </div>
            
            <div className="p-6">
              {staffList.length > 0 ? (
                <MobileTable
                  data={staffList}
                  columns={tableColumns}
                  actions={[
                    {
                      label: 'Edit',
                      onClick: (item) => openEditForm(item),
                      variant: 'primary',
                      size: 'sm'
                    },
                    {
                      label: item => item.is_active ? 'Deactivate' : 'Activate',
                      onClick: (item) => handleToggleStatus(item.id, item.is_active),
                      variant: item => item.is_active ? 'warning' : 'success',
                      size: 'sm'
                    },
                    {
                      label: 'Delete',
                      onClick: (item) => handleDeleteStaff(item.id),
                      variant: 'danger',
                      size: 'sm'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No staff members found</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Add Staff Modal */}
      <MobileModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Staff"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MobileInput
              label="Employee Code"
              name="employee_code"
              value={formData.employee_code}
              onChange={handleInputChange}
              required
              placeholder="EMP001"
            />
            <MobileInput
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
            />
            <MobileInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="john@example.com"
            />
            <MobileInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1234567890"
            />
            <MobileInput
              label="Basic Salary"
              name="basic_salary"
              type="number"
              value={formData.basic_salary}
              onChange={handleInputChange}
              required
              placeholder="50000"
            />
            <MobileInput
              label="Incentive Percentage"
              name="incentive_percentage"
              type="number"
              value={formData.incentive_percentage}
              onChange={handleInputChange}
              required
              placeholder="5"
            />
            <MobileInput
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Sales"
            />
            <MobileInput
              label="Joining Date"
              name="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter password"
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
              Add Staff
            </MobileButton>
          </div>
        </form>
      </MobileModal>

      {/* Edit Staff Modal */}
      <MobileModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title="Edit Staff Member"
      >
        <form onSubmit={handleEditStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MobileInput
              label="Employee Code"
              name="employee_code"
              value={formData.employee_code}
              onChange={handleInputChange}
              required
              placeholder="EMP001"
            />
            <MobileInput
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
            />
            <MobileInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="john@example.com"
            />
            <MobileInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1234567890"
            />
            <MobileInput
              label="Basic Salary"
              name="basic_salary"
              type="number"
              value={formData.basic_salary}
              onChange={handleInputChange}
              required
              placeholder="50000"
            />
            <MobileInput
              label="Incentive Percentage"
              name="incentive_percentage"
              type="number"
              value={formData.incentive_percentage}
              onChange={handleInputChange}
              required
              placeholder="5"
            />
            <MobileInput
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Sales"
            />
            <MobileInput
              label="Joining Date"
              name="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="New Password (Optional)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setEditingStaff(null)}
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
              Update Staff
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminStaff;