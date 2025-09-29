/**
 * Error handling utilities for the application
 */

/**
 * Handle API errors and provide user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, context = 'operation') => {
  console.error(`Error in ${context}:`, error);
  
  // Network errors
  if (!error.response) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  const status = error.response?.status;
  const data = error.response?.data;
  
  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      return data?.detail || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authorized to perform this action. Please log in again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return data?.detail || 'This action conflicts with existing data. Please check and try again.';
    case 422:
      return data?.detail || 'Invalid data provided. Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later or contact support.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return data?.detail || `An error occurred during ${context}. Please try again.`;
  }
};

/**
 * Show error toast notification
 * @param {string} message - Error message to display
 * @param {string} type - Type of error (error, warning, info)
 */
export const showErrorToast = (message, type = 'error') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
    type === 'error' ? 'border-l-4 border-red-500' : 
    type === 'warning' ? 'border-l-4 border-yellow-500' : 
    'border-l-4 border-blue-500'
  }`;
  
  toast.innerHTML = `
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${type === 'error' ? `
            <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ` : type === 'warning' ? `
            <svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ` : `
            <svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          `}
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">
            ${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}
          </p>
          <p class="mt-1 text-sm text-gray-500">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="this.parentElement.parentElement.parentElement.remove()">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
};

/**
 * Show success toast notification
 * @param {string} message - Success message to display
 */
export const showSuccessToast = (message) => {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 border-green-500';
  
  toast.innerHTML = `
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">Success</p>
          <p class="mt-1 text-sm text-gray-500">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="this.parentElement.parentElement.parentElement.remove()">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 3000);
};

/**
 * Show loading state
 * @param {boolean} isLoading - Whether to show loading state
 * @param {string} message - Loading message
 */
export const showLoadingState = (isLoading, message = 'Loading...') => {
  const existingLoader = document.getElementById('global-loader');
  
  if (isLoading) {
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    loader.innerHTML = `
      <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-gray-700">${message}</span>
      </div>
    `;
    
    document.body.appendChild(loader);
  } else {
    if (existingLoader) {
      existingLoader.remove();
    }
  }
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
 */
export const validateFormData = (data, rules) => {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      continue;
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      continue;
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be no more than ${rule.maxLength} characters`;
      continue;
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${rule.label || field} format is invalid`;
      continue;
    }
    
    if (value && rule.min && Number(value) < rule.min) {
      errors[field] = `${rule.label || field} must be at least ${rule.min}`;
      continue;
    }
    
    if (value && rule.max && Number(value) > rule.max) {
      errors[field] = `${rule.label || field} must be no more than ${rule.max}`;
      continue;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format error message for display
 * @param {Error} error - The error object
 * @param {string} fallback - Fallback message if error is not parseable
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return fallback;
};