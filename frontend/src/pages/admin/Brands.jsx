import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminBrands = () => {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_code: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const data = await apiService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
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

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      await apiService.createBrand(formData);
      setShowAddForm(false);
      setFormData({
        brand_name: '',
        brand_code: '',
        description: '',
        category: ''
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to add brand:', error);
    }
  };

  const handleEditBrand = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateBrand(editingBrand.id, formData);
      setEditingBrand(null);
      setFormData({
        brand_name: '',
        brand_code: '',
        description: '',
        category: ''
      });
      fetchBrands();
    } catch (error) {
      console.error('Failed to update brand:', error);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await apiService.deleteBrand(brandId);
        fetchBrands();
      } catch (error) {
        console.error('Failed to delete brand:', error);
      }
    }
  };

  const openEditForm = (brand) => {
    setEditingBrand(brand);
    setFormData({
      brand_name: brand.brand_name,
      brand_code: brand.brand_code,
      description: brand.description || '',
      category: brand.category || ''
    });
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading brands..." />;
  }

  const tableColumns = [
    {
      key: 'brand_name',
      header: 'Brand Name',
      render: (value) => value
    },
    {
      key: 'brand_code',
      header: 'Brand Code',
      render: (value) => value
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => value || 'N/A'
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => value || 'N/A'
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
              <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
              <p className="text-sm text-gray-600">Manage product brands and categories</p>
            </div>
            <MobileButton
              onClick={() => setShowAddForm(true)}
              variant="primary"
              size="md"
            >
              Add Brand
            </MobileButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Brands Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Brands</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {brands.length}
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
                  <p className="text-sm font-medium text-gray-500">Active Brands</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {brands.filter(brand => brand.is_active).length}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(brands.map(brand => brand.category).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Brands List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Brands List</h3>
              <p className="text-sm text-gray-500 mt-1">Manage all product brands in the system</p>
            </div>
            
            <div className="p-6">
              {brands.length > 0 ? (
                <MobileTable
                  data={brands}
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
                      onClick: (item) => handleDeleteBrand(item.id),
                      variant: 'danger',
                      size: 'sm'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No brands found</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Add Brand Modal */}
      <MobileModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Brand"
      >
        <form onSubmit={handleAddBrand} className="space-y-4">
          <MobileInput
            label="Brand Name"
            name="brand_name"
            value={formData.brand_name}
            onChange={handleInputChange}
            required
            placeholder="Enter brand name"
          />
          <MobileInput
            label="Brand Code"
            name="brand_code"
            value={formData.brand_code}
            onChange={handleInputChange}
            required
            placeholder="Enter brand code"
          />
          <MobileInput
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            placeholder="Enter category"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter brand description"
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
              Add Brand
            </MobileButton>
          </div>
        </form>
      </MobileModal>

      {/* Edit Brand Modal */}
      <MobileModal
        isOpen={!!editingBrand}
        onClose={() => setEditingBrand(null)}
        title="Edit Brand"
      >
        <form onSubmit={handleEditBrand} className="space-y-4">
          <MobileInput
            label="Brand Name"
            name="brand_name"
            value={formData.brand_name}
            onChange={handleInputChange}
            required
            placeholder="Enter brand name"
          />
          <MobileInput
            label="Brand Code"
            name="brand_code"
            value={formData.brand_code}
            onChange={handleInputChange}
            required
            placeholder="Enter brand code"
          />
          <MobileInput
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            placeholder="Enter category"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter brand description"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setEditingBrand(null)}
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
              Update Brand
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminBrands;