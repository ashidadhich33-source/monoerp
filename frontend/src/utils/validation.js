/**
 * Data validation utilities
 */

/**
 * Validation rules for different data types
 */
export const validationRules = {
  // Staff validation
  staff: {
    employee_code: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[A-Z0-9]+$/,
      message: 'Employee code must be 3-20 characters, uppercase letters and numbers only'
    },
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s]+$/,
      message: 'Name must be 2-100 characters, letters and spaces only'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    phone: {
      required: false,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number'
    },
    basic_salary: {
      required: true,
      min: 0,
      max: 1000000,
      message: 'Basic salary must be between 0 and 1,000,000'
    },
    incentive_percentage: {
      required: true,
      min: 0,
      max: 100,
      message: 'Incentive percentage must be between 0 and 100'
    }
  },
  
  // Sales validation
  sales: {
    staff_id: {
      required: true,
      message: 'Staff member is required'
    },
    brand_id: {
      required: true,
      message: 'Brand is required'
    },
    sale_amount: {
      required: true,
      min: 0.01,
      max: 1000000,
      message: 'Sale amount must be between 0.01 and 1,000,000'
    },
    sale_date: {
      required: true,
      message: 'Sale date is required'
    },
    units_sold: {
      required: true,
      min: 1,
      max: 10000,
      message: 'Units sold must be between 1 and 10,000'
    }
  },
  
  // Attendance validation
  attendance: {
    staff_id: {
      required: true,
      message: 'Staff member is required'
    },
    date: {
      required: true,
      message: 'Date is required'
    },
    check_in_time: {
      required: true,
      message: 'Check-in time is required'
    },
    check_out_time: {
      required: false,
      message: 'Check-out time is required'
    }
  },
  
  // Target validation
  target: {
    staff_id: {
      required: true,
      message: 'Staff member is required'
    },
    target_type: {
      required: true,
      message: 'Target type is required'
    },
    total_target_amount: {
      required: true,
      min: 0.01,
      max: 10000000,
      message: 'Target amount must be between 0.01 and 10,000,000'
    },
    period_start: {
      required: true,
      message: 'Period start date is required'
    },
    period_end: {
      required: true,
      message: 'Period end date is required'
    },
    incentive_percentage: {
      required: true,
      min: 0,
      max: 100,
      message: 'Incentive percentage must be between 0 and 100'
    }
  },
  
  // Advance validation
  advance: {
    staff_id: {
      required: true,
      message: 'Staff member is required'
    },
    advance_amount: {
      required: true,
      min: 0.01,
      max: 1000000,
      message: 'Advance amount must be between 0.01 and 1,000,000'
    },
    issue_date: {
      required: true,
      message: 'Issue date is required'
    },
    deduction_plan: {
      required: true,
      message: 'Deduction plan is required'
    },
    monthly_deduction_amount: {
      required: false,
      min: 0.01,
      max: 100000,
      message: 'Monthly deduction amount must be between 0.01 and 100,000'
    }
  },
  
  // Brand validation
  brand: {
    brand_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Brand name must be 2-100 characters'
    },
    brand_code: {
      required: true,
      minLength: 2,
      maxLength: 20,
      pattern: /^[A-Z0-9]+$/,
      message: 'Brand code must be 2-20 characters, uppercase letters and numbers only'
    },
    description: {
      required: false,
      maxLength: 500,
      message: 'Description must be no more than 500 characters'
    },
    category: {
      required: false,
      maxLength: 50,
      message: 'Category must be no more than 50 characters'
    }
  }
};

/**
 * Validate a single field
 * @param {any} value - The value to validate
 * @param {Object} rule - The validation rule
 * @param {string} fieldName - The field name for error messages
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (value, rule, fieldName) => {
  // Check required
  if (rule.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} is required`;
  }
  
  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }
  
  // Check min length
  if (rule.minLength && value.length < rule.minLength) {
    return `${fieldName} must be at least ${rule.minLength} characters`;
  }
  
  // Check max length
  if (rule.maxLength && value.length > rule.maxLength) {
    return `${fieldName} must be no more than ${rule.maxLength} characters`;
  }
  
  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message || `${fieldName} format is invalid`;
  }
  
  // Check min value
  if (rule.min !== undefined && Number(value) < rule.min) {
    return `${fieldName} must be at least ${rule.min}`;
  }
  
  // Check max value
  if (rule.max !== undefined && Number(value) > rule.max) {
    return `${fieldName} must be no more than ${rule.max}`;
  }
  
  return null;
};

/**
 * Validate form data against rules
 * @param {Object} data - The data to validate
 * @param {Object} rules - The validation rules
 * @returns {Object} Validation result with isValid and errors
 */
export const validateFormData = (data, rules) => {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldName = rule.label || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const error = validateField(value, rule, fieldName);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  const errors = {};
  
  if (!startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!endDate) {
    errors.endDate = 'End date is required';
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.dateRange = 'Start date must be before end date';
    }
    
    // Check if date range is not too far in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    if (start > maxDate) {
      errors.startDate = 'Start date cannot be more than 1 year in the future';
    }
    
    if (end > maxDate) {
      errors.endDate = 'End date cannot be more than 1 year in the future';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate file upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const errors = {};
  
  if (!file) {
    errors.file = 'File is required';
    return { isValid: false, errors };
  }
  
  // Check file size
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
  if (file.size > maxSize) {
    errors.file = `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
  }
  
  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.file = `File type must be one of: ${options.allowedTypes.join(', ')}`;
  }
  
  // Check file extension
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!options.allowedExtensions.includes(extension)) {
      errors.file = `File extension must be one of: ${options.allowedExtensions.join(', ')}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input data
 * @param {any} value - The value to sanitize
 * @param {string} type - The data type
 * @returns {any} Sanitized value
 */
export const sanitizeInput = (value, type = 'string') => {
  if (value === null || value === undefined) {
    return value;
  }
  
  switch (type) {
    case 'string':
      return value.toString().trim();
    case 'number':
      return Number(value);
    case 'email':
      return value.toString().trim().toLowerCase();
    case 'phone':
      return value.toString().replace(/[^\d+]/g, '');
    case 'date':
      return new Date(value).toISOString().split('T')[0];
    default:
      return value;
  }
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};