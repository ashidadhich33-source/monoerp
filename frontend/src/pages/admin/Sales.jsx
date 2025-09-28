import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminSales = () => {
  const { user, logout } = useAuth();
  const [salesList, setSalesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    brand_id: '',
    sale_amount: '',
    sale_date: '',
    units_sold: ''
  });

  useEffect(() => {
    fetchSalesData();
    fetchStaffList();
    fetchBrandsList();
  }, []);

  const fetchSalesData = async () => {
    try {
      const data = await apiService.getAllStaffSales();
      setSalesList(data);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
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

  const fetchBrandsList = async () => {
    try {
      const data = await apiService.getBrandsList();
      setBrandsList(data);
    } catch (error) {
      console.error('Failed to fetch brands list:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      await apiService.createSales(formData);
      setShowAddForm(false);
      setFormData({
        staff_id: '',
        brand_id: '',
        sale_amount: '',
        sale_date: '',
        units_sold: ''
      });
      fetchSalesData();
    } catch (error) {
      console.error('Failed to add sale:', error);
    }
  };

  const handleEditSale = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateSales(editingSale.id, formData);
      setEditingSale(null);
      setFormData({
        staff_id: '',
        brand_id: '',
        sale_amount: '',
        sale_date: '',
        units_sold: ''
      });
      fetchSalesData();
    } catch (error) {
      console.error('Failed to update sale:', error);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale record?')) {
      try {
        await apiService.deleteSales(saleId);
        fetchSalesData();
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      await apiService.uploadSalesExcel(formData);
      setShowExcelUpload(false);
      setExcelFile(null);
      fetchSalesData();
    } catch (error) {
      console.error('Failed to upload Excel file:', error);
    }
  };

  const openEditForm = (sale) => {
    setEditingSale(sale);
    setFormData({
      staff_id: sale.staff_id,
      brand_id: sale.brand_id,
      sale_amount: sale.sale_amount,
      sale_date: sale.sale_date,
      units_sold: sale.units_sold
    });
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading sales data..." />;
  }

  const tableColumns = [
    {
      key: 'staff_name',
      header: 'Staff Name',
      render: (value) => value
    },
    {
      key: 'brand_name',
      header: 'Brand',
      render: (value) => value
    },
    {
      key: 'sale_amount',
      header: 'Sale Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'units_sold',
      header: 'Units Sold',
      render: (value) => value
    },
    {
      key: 'sale_date',
      header: 'Sale Date',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
              <p className="text-sm text-gray-600">Manage sales records and upload Excel data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <MobileButton
              onClick={() => setShowAddForm(true)}
              variant="primary"
              size="md"
            >
              Add New Sale
            </MobileButton>
            <MobileButton
              onClick={() => setShowExcelUpload(true)}
              variant="secondary"
              size="md"
            >
              Upload Excel File
            </MobileButton>
          </div>

          {/* Sales Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{salesList.reduce((total, sale) => total + sale.sale_amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesList.reduce((total, sale) => total + sale.units_sold, 0)}
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
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesList.length}
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Sales List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Records</h3>
            </div>
            
            <div className="p-6">
              {salesList.length > 0 ? (
                <MobileTable
                  data={salesList}
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
                      onClick: (item) => handleDeleteSale(item.id),
                      variant: 'danger',
                      size: 'sm'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sales records found</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Add Sale Modal */}
      <MobileModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Sale"
      >
        <form onSubmit={handleAddSale} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Brand</option>
                {brandsList.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.brand_name}</option>
                ))}
              </select>
            </div>
            <MobileInput
              label="Sale Amount"
              name="sale_amount"
              type="number"
              value={formData.sale_amount}
              onChange={handleInputChange}
              required
              placeholder="10000"
            />
            <MobileInput
              label="Sale Date"
              name="sale_date"
              type="date"
              value={formData.sale_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="Units Sold"
              name="units_sold"
              type="number"
              value={formData.units_sold}
              onChange={handleInputChange}
              required
              placeholder="5"
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
              Add Sale
            </MobileButton>
          </div>
        </form>
      </MobileModal>

      {/* Edit Sale Modal */}
      <MobileModal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title="Edit Sale Record"
      >
        <form onSubmit={handleEditSale} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Brand</option>
                {brandsList.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.brand_name}</option>
                ))}
              </select>
            </div>
            <MobileInput
              label="Sale Amount"
              name="sale_amount"
              type="number"
              value={formData.sale_amount}
              onChange={handleInputChange}
              required
              placeholder="10000"
            />
            <MobileInput
              label="Sale Date"
              name="sale_date"
              type="date"
              value={formData.sale_date}
              onChange={handleInputChange}
              required
            />
            <MobileInput
              label="Units Sold"
              name="units_sold"
              type="number"
              value={formData.units_sold}
              onChange={handleInputChange}
              required
              placeholder="5"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setEditingSale(null)}
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
              Update Sale
            </MobileButton>
          </div>
        </form>
      </MobileModal>

      {/* Excel Upload Modal */}
      <MobileModal
        isOpen={showExcelUpload}
        onClose={() => setShowExcelUpload(false)}
        title="Upload Sales Excel File"
      >
        <form onSubmit={handleExcelUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload an Excel file with sales data. Make sure the file has columns: Staff Name, Brand, Sale Amount, Sale Date, Units Sold
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setShowExcelUpload(false)}
              variant="secondary"
              size="md"
            >
              Cancel
            </MobileButton>
            <MobileButton
              type="submit"
              variant="primary"
              size="md"
              disabled={!excelFile}
            >
              Upload File
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminSales;