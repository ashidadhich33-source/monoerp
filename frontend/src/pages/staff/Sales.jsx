import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileLoading from '../../components/MobileLoading';

const StaffSales = () => {
  const { user, logout } = useAuth();
  const [personalSales, setPersonalSales] = useState([]);
  const [allStaffSales, setAllStaffSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const [personalData, allStaffData] = await Promise.all([
        apiService.getPersonalSales(),
        apiService.getAllStaffSales()
      ]);
      setPersonalSales(personalData);
      setAllStaffSales(allStaffData);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = async () => {
    setLoading(true);
    try {
      const [personalData, allStaffData] = await Promise.all([
        apiService.getPersonalSales(dateRange.startDate, dateRange.endDate),
        apiService.getAllStaffSales(dateRange.startDate, dateRange.endDate)
      ]);
      setPersonalSales(personalData);
      setAllStaffSales(allStaffData);
    } catch (error) {
      console.error('Failed to fetch filtered sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchSalesData();
  };

  const getTotalSales = (sales) => {
    return sales.reduce((total, sale) => total + sale.sale_amount, 0);
  };

  const getTotalUnits = (sales) => {
    return sales.reduce((total, sale) => total + sale.units_sold, 0);
  };

  const getBrandBreakdown = (sales) => {
    const brandMap = {};
    sales.forEach(sale => {
      if (brandMap[sale.brand_name]) {
        brandMap[sale.brand_name].amount += sale.sale_amount;
        brandMap[sale.brand_name].units += sale.units_sold;
        brandMap[sale.brand_name].count += 1;
      } else {
        brandMap[sale.brand_name] = {
          amount: sale.sale_amount,
          units: sale.units_sold,
          count: 1
        };
      }
    });
    return Object.entries(brandMap).map(([brand, data]) => ({
      brand,
      ...data
    }));
  };

  const currentSales = activeTab === 'personal' ? personalSales : allStaffSales;
  const brandBreakdown = getBrandBreakdown(currentSales);

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
              <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
              <p className="text-sm text-gray-600">View your sales performance and team sales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Filters */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filter Sales Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MobileInput
                label="Start Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
              <MobileInput
                label="End Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
              <div className="flex items-end space-x-2">
                <MobileButton
                  onClick={handleDateFilter}
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  Apply Filter
                </MobileButton>
                <MobileButton
                  onClick={clearFilters}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Clear
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Tab Navigation */}
          <MobileCard className="p-0">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'personal'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Personal Sales
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Staff Sales
                </button>
              </nav>
            </div>
          </MobileCard>

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
                  <p className="text-sm font-medium text-gray-500">Total Sales Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{getTotalSales(currentSales).toLocaleString()}
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
                  <p className="text-sm font-medium text-gray-500">Total Units Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getTotalUnits(currentSales)}
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
                    {currentSales.length}
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Brand Breakdown */}
          {brandBreakdown.length > 0 && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand-wise Breakdown</h3>
              <div className="space-y-3">
                {brandBreakdown.map((brand, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{brand.brand}</p>
                      <p className="text-sm text-gray-500">{brand.count} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{brand.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{brand.units} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          )}

          {/* Sales Table */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === 'personal' ? 'Personal Sales' : 'All Staff Sales'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'personal' 
                  ? 'Your sales performance records' 
                  : 'Team sales performance records'
                }
              </p>
            </div>
            
            <div className="p-6">
              <MobileTable
                data={currentSales}
                columns={activeTab === 'all' ? tableColumns : tableColumns.filter(col => col.key !== 'staff_name')}
                className="min-w-full"
              />
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default StaffSales;