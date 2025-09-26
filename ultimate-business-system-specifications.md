# Ultimate Complete Business Management System - Master Specifications

## Project Overview
Create a comprehensive AI-powered business management system for a kids clothing store that integrates with existing Logic ERP while providing modern features including advanced POS, staff management with attendance fraud prevention, automated salary calculations, CRM with multi-child family management, loyalty program, WhatsApp Business integration, automated backup system, advanced discount management, AI recommendations, and professional ERP interface.

## Core System Architecture

### Technology Stack
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React.js with TypeScript and Material-UI/Ant Design
- **Database**: MySQL 8.0+ (dual database architecture)
- **Mobile**: Progressive Web App (PWA)
- **Integration**: Direct Logic ERP database connection with real-time sync
- **Communication**: WhatsApp Business API with automation
- **Authentication**: JWT with Logic ERP staff integration
- **AI System**: Custom FireAI recommendation engine with machine learning
- **Backup**: Automated daily backup system with cloud storage and verification

### Database Architecture
```
System Databases:
├── logic_erp_db (EXISTING - Read/Write for business operations)
└── business_management_db (NEW - Complete system features with AI and automation)
```

## 1. Enhanced Backup System (Daily Automated on Login)

### Backup System Implementation
```sql
CREATE TABLE system_backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_type ENUM('daily', 'weekly', 'monthly', 'manual'),
    backup_date DATETIME,
    backup_size BIGINT,
    backup_location VARCHAR(500),
    backup_cloud_location VARCHAR(500),
    backup_status ENUM('in_progress', 'completed', 'failed'),
    retention_date DATE,
    triggered_by ENUM('login', 'schedule', 'manual'),
    user_id INT,
    databases_included JSON,
    verification_status ENUM('pending', 'passed', 'failed'),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_verification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_id INT,
    verification_type ENUM('integrity', 'restore_test'),
    verification_status ENUM('passed', 'failed'),
    verification_date DATETIME,
    error_details TEXT,
    FOREIGN KEY (backup_id) REFERENCES system_backups(id)
);
```

### Backup Logic Implementation
```text
Daily Backup System Configuration:
const dailyBackupSystem = {
    triggerOnLogin: {
        checkLastBackup: 'if_older_than_24_hours',
        autoTrigger: true,
        backgroundProcess: true
    },
    
    backupProcess: {
        databases: ['business_management_db', 'logic_erp_db'],
        files: ['uploads', 'config', 'logs', 'whatsapp_media'],
        compression: 'gzip',
        encryption: 'AES-256',
        localStorage: '/backups/daily/',
        cloudStorage: 's3_compatible_storage',
        retention: 'local_30_days_cloud_90_days'
    },
    
    verification: {
        integrityCheck: true,
        weeklyRestoreTest: true,
        adminNotification: true,
        healthCheck: 'database_consistency_check'
    }
};
```

## 2. Logic ERP Integration Layer (Enhanced with Brand Sync)

### Auto-Discovery and Brand Integration
```text
Enhanced ERP Integration Configuration:
const enhancedERPIntegration = {
    autoDiscovery: {
        analyzeSchema: 'logic_erp_sql_file',
        identifyTables: ['products', 'customers', 'sales', 'staff', 'bill_series', 'brands', 'categories'],
        createFieldMappings: 'automatic_type_conversion',
        detectRelationships: 'foreign_key_analysis'
    },
    
    brandSynchronization: {
        fetchBrands: true,
        syncFrequency: 'every_hour',
        createMissingBrands: true,
        updateBrandDetails: true,
        brandDiscountRules: true
    },
    
    realTimeSync: {
        billNumbers: 'atomic_operations_with_locking',
        inventory: 'immediate_stock_updates',
        customers: 'bidirectional_sync',
        staff: 'authentication_and_permissions'
    }
};
```

### Brand Management System
```sql
CREATE TABLE brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    logic_erp_brand_id INT UNIQUE,
    brand_name VARCHAR(255) NOT NULL,
    brand_code VARCHAR(50),
    brand_logo VARCHAR(255),
    brand_description TEXT,
    brand_category VARCHAR(100),
    brand_origin_country VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    is_eco_friendly BOOLEAN DEFAULT FALSE,
    age_group_focus JSON,
    size_chart_type VARCHAR(50),
    discount_eligibility BOOLEAN DEFAULT TRUE,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    logic_erp_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE brand_sync_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sync_type ENUM('create', 'update', 'delete'),
    logic_erp_brand_id INT,
    local_brand_id INT,
    sync_status ENUM('success', 'failed', 'pending'),
    sync_data JSON,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Enhanced Customer Management (Multi-Child Families)

### Family Profile System (Up to 3 Children)
```sql
-- Enhanced customer table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    date_of_birth DATE,
    anniversary_date DATE,
    gst_number VARCHAR(20),
    customer_type ENUM('retail', 'wholesale', 'distributor'),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    credit_days INT DEFAULT 0,
    family_type ENUM('single_child', 'two_children', 'three_children') DEFAULT 'single_child',
    total_children INT DEFAULT 1,
    preferred_categories JSON,
    communication_preferences JSON,
    is_active BOOLEAN DEFAULT TRUE,
    logic_erp_customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Children profiles (up to 3 per family)
CREATE TABLE customer_children (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    child_sequence INT, -- 1, 2, or 3
    child_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('boy', 'girl'),
    current_size VARCHAR(20),
    size_history JSON,
    growth_pattern JSON,
    color_preferences JSON,
    character_preferences JSON,
    special_occasions JSON,
    clothing_budget DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE KEY unique_customer_child (customer_id, child_sequence),
    CONSTRAINT chk_child_sequence CHECK (child_sequence IN (1, 2, 3))
);

-- Size prediction and growth tracking
CREATE TABLE size_predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_id INT,
    predicted_size VARCHAR(20),
    prediction_date DATE,
    prediction_confidence DECIMAL(5,2),
    actual_size_purchased VARCHAR(20),
    prediction_accuracy DECIMAL(5,2),
    growth_milestone JSON,
    next_size_date DATE,
    FOREIGN KEY (child_id) REFERENCES customer_children(id)
);

-- Child-specific purchase history
CREATE TABLE child_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_id INT,
    sale_id INT,
    product_id INT,
    size_purchased VARCHAR(20),
    purchase_date DATE,
    fit_feedback ENUM('too_small', 'perfect', 'too_large'),
    usage_duration INT,
    FOREIGN KEY (child_id) REFERENCES customer_children(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);
```

## 4. Advanced Discount Management System

### Comprehensive Discount Framework
```sql
CREATE TABLE discount_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    discount_name VARCHAR(255) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'bulk_discount', 'seasonal', 'clearance'),
    application_level ENUM('item', 'category', 'brand', 'total_bill', 'customer_type'),
    discount_value DECIMAL(10,2),
    minimum_quantity INT DEFAULT 1,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    is_combinable BOOLEAN DEFAULT FALSE,
    requires_coupon BOOLEAN DEFAULT FALSE,
    auto_apply BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 1,
    applicable_days JSON,
    applicable_hours JSON,
    customer_eligibility JSON,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    usage_limit INT,
    usage_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE discount_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    discount_id INT,
    rule_type ENUM('product', 'category', 'brand', 'customer_type', 'quantity', 'amount', 'age_group', 'size'),
    rule_value VARCHAR(255),
    rule_operator ENUM('equals', 'greater_than', 'less_than', 'between', 'in', 'not_in'),
    rule_parameters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discount_types(id)
);

-- Brand-specific discount rules
CREATE TABLE brand_discounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    brand_id INT,
    discount_id INT,
    brand_specific_rate DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (discount_id) REFERENCES discount_types(id),
    INDEX idx_brand_discounts (brand_id)
);

-- Applied discounts tracking
CREATE TABLE applied_discounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT,
    discount_id INT,
    discount_type ENUM('automatic', 'manual', 'coupon', 'loyalty', 'owner_discount'),
    discount_amount DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    applied_to ENUM('item', 'total'),
    product_id INT,
    applied_by INT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (discount_id) REFERENCES discount_types(id)
);
```

## 5. Owner Discount System (Payment-Level with Auto Expenses)

### Store Owner Discount Management
```sql
-- Owner discount system (separate from regular discounts)
CREATE TABLE owner_discounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    discount_name VARCHAR(255) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount'),
    discount_value DECIMAL(10,2),
    requires_authorization BOOLEAN DEFAULT TRUE,
    authorized_staff JSON,
    reason_required BOOLEAN DEFAULT TRUE,
    maximum_amount_per_day DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Owner discount applications (payment level only)
CREATE TABLE owner_discount_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT,
    owner_discount_id INT,
    discount_amount DECIMAL(10,2),
    discount_reason TEXT,
    applied_by_staff_id INT,
    authorized_by_staff_id INT,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    expense_entry_id INT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (owner_discount_id) REFERENCES owner_discounts(id)
);
```

## 6. Enhanced Loyalty System (Payment-Level Redemption)

### Payment-Level Loyalty Redemption (Not Item-Wise)
```sql
-- Enhanced loyalty redemption (payment level only)
CREATE TABLE loyalty_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    sale_id INT,
    points_redeemed INT,
    redemption_value DECIMAL(10,2),
    redemption_type ENUM('payment_discount', 'cash_equivalent'),
    applied_at_payment BOOLEAN DEFAULT TRUE,
    expense_entry_id INT,
    processed_by_staff_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Loyalty program configuration
CREATE TABLE loyalty_programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_name VARCHAR(255),
    program_type ENUM('points', 'cashback', 'discount'),
    earn_rate DECIMAL(5,2),
    redemption_rate DECIMAL(5,2),
    minimum_earning_amount DECIMAL(8,2) DEFAULT 0,
    minimum_redemption_points INT DEFAULT 0,
    maximum_redemption_percentage DECIMAL(5,2) DEFAULT 100,
    validity_days INT DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer loyalty accounts
CREATE TABLE customer_loyalty (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    current_points INT DEFAULT 0,
    total_earned_points INT DEFAULT 0,
    total_redeemed_points INT DEFAULT 0,
    tier_level ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    last_activity_date DATE,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Points transaction history
CREATE TABLE loyalty_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted'),
    points INT,
    sale_id INT,
    description TEXT,
    expiry_date DATE,
    redemption_expense_id INT,
    applied_at_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

## 7. Automated Coupon System for Inactive Customers

### Time-Based Customer Reactivation Coupons
```sql
-- Automated coupon generation system
CREATE TABLE automated_coupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(20) UNIQUE,
    coupon_name VARCHAR(255),
    coupon_type ENUM('reactivation_3m', 'reactivation_6m', 'reactivation_12m', 'birthday', 'anniversary'),
    customer_id INT,
    discount_type ENUM('percentage', 'fixed_amount'),
    discount_value DECIMAL(10,2),
    minimum_purchase_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    generated_date DATE,
    expiry_date DATE,
    is_time_based BOOLEAN DEFAULT TRUE,
    usage_limit INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    coupon_status ENUM('generated', 'sent', 'used', 'expired', 'cancelled') DEFAULT 'generated',
    whatsapp_sent_at TIMESTAMP NULL,
    redemption_expense_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Coupon redemption tracking
CREATE TABLE coupon_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_id INT,
    sale_id INT,
    customer_id INT,
    redemption_amount DECIMAL(10,2),
    expense_entry_id INT,
    redeemed_by_staff_id INT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES automated_coupons(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Customer activity tracking for automated coupon eligibility
CREATE TABLE customer_activity_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    last_purchase_date DATE,
    last_visit_date DATE,
    last_whatsapp_interaction DATE,
    activity_score INT DEFAULT 0,
    inactive_period_days INT,
    coupon_eligibility ENUM('active', 'eligible_3m', 'eligible_6m', 'eligible_12m') DEFAULT 'active',
    last_coupon_generated DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### Automated Coupon Generation Logic
```javascript
const automaticCouponSystem = {
    inactivityTriggers: {
        threeMonths: {
            days: 90,
            discountType: 'percentage',
            discountValue: 15,
            expiryDays: 30,
            whatsappTemplate: 'comeback_3m_offer'
        },
        sixMonths: {
            days: 180,
            discountType: 'percentage', 
            discountValue: 20,
            expiryDays: 45,
            whatsappTemplate: 'comeback_6m_offer'
        },
        oneYear: {
            days: 365,
            discountType: 'percentage',
            discountValue: 25,
            expiryDays: 60,
            whatsappTemplate: 'comeback_12m_offer'
        }
    },
    
    generationProcess: {
        dailyCheck: true,
        batchProcessing: true,
        whatsappDelivery: true,
        expenseAutoEntry: true,
        eligibilityRules: 'no_coupon_in_last_30_days'
    }
};
```

## 8. Custom FireAI Recommendation System

### Built-in AI Engine
```sql
-- AI recommendation system
CREATE TABLE ai_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recommendation_type ENUM('product', 'size', 'outfit', 'upsell', 'cross_sell', 'reorder', 'discount'),
    entity_id INT,
    entity_type ENUM('customer', 'product', 'sale', 'child'),
    recommendation_data JSON,
    confidence_score DECIMAL(5,2),
    recommendation_source ENUM('purchase_history', 'browsing_behavior', 'seasonal', 'trending', 'size_prediction', 'ai_analysis'),
    is_displayed BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE,
    is_purchased BOOLEAN DEFAULT FALSE,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- AI learning and training data
CREATE TABLE ai_learning_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_type ENUM('purchase', 'view', 'search', 'return', 'size_feedback', 'discount_response'),
    customer_id INT,
    child_id INT,
    product_id INT,
    interaction_data JSON,
    context_data JSON,
    outcome ENUM('positive', 'negative', 'neutral'),
    learning_weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI model performance tracking
CREATE TABLE ai_model_performance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_type ENUM('size_prediction', 'product_recommendation', 'customer_segmentation', 'demand_forecasting', 'discount_optimization'),
    model_version VARCHAR(50),
    accuracy_score DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall_score DECIMAL(5,2),
    training_data_count INT,
    last_trained_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    performance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-powered customer insights
CREATE TABLE ai_customer_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    insight_type ENUM('buying_pattern', 'size_prediction', 'churn_risk', 'lifetime_value', 'next_purchase_date'),
    insight_data JSON,
    confidence_level DECIMAL(5,2),
    generated_date DATE,
    is_actionable BOOLEAN DEFAULT TRUE,
    action_taken BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### FireAI Implementation Framework
```javascript
const customFireAI = {
    recommendations: {
        productSuggestions: 'ml_collaborative_filtering_and_content_based',
        sizePrediction: 'growth_pattern_analysis_with_regression',
        outfitCompletion: 'style_matching_algorithm',
        seasonalSuggestions: 'weather_occasion_trend_analysis',
        reorderPrediction: 'usage_pattern_time_series_analysis',
        discountOptimization: 'price_elasticity_and_customer_response'
    },
    
    customerIntelligence: {
        segmentation: 'unsupervised_clustering_with_behavior_features',
        lifetimeValue: 'predictive_analytics_with_cohort_analysis',
        churnPrediction: 'gradient_boosting_with_engagement_features',
        nextPurchaseDate: 'time_series_forecasting',
        priceOptimization: 'dynamic_pricing_based_on_demand_elasticity'
    },
    
    businessIntelligence: {
        demandForecasting: 'seasonal_decomposition_with_external_factors',
        inventoryOptimization: 'reinforcement_learning_for_stock_management',
        staffPerformance: 'performance_prediction_with_leading_indicators',
        marketingOptimization: 'campaign_effectiveness_prediction'
    },
    
    automations: {
        personalizedCampaigns: 'ai_generated_customer_specific_offers',
        dynamicPricing: 'real_time_price_adjustment_based_on_demand',
        smartNotifications: 'behavioral_trigger_optimization',
        contentGeneration: 'nlp_for_product_descriptions_and_marketing'
    }
};
```

## 9. Staff Management System (Complete)

### Staff Authentication & Integration
```sql
-- Staff profiles with Logic ERP integration
CREATE TABLE staff_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    logic_erp_staff_id INT UNIQUE,
    staff_code VARCHAR(50),
    full_name VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    location VARCHAR(100),
    date_of_joining DATE,
    basic_salary DECIMAL(10,2),
    fixed_incentive_percentage DECIMAL(5,2) DEFAULT 10.00,
    profile_photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance management with fraud prevention
CREATE TABLE staff_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    attendance_date DATE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_location JSON,
    check_out_location JSON,
    check_in_device_info JSON,
    check_out_device_info JSON,
    check_in_photo VARCHAR(255),
    check_out_photo VARCHAR(255),
    total_hours DECIMAL(4,2),
    attendance_type ENUM('present', 'half_day', 'absent', 'leave', 'holiday', 'overtime'),
    is_sunday BOOLEAN DEFAULT FALSE,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    late_arrival_minutes INT DEFAULT 0,
    early_departure_minutes INT DEFAULT 0,
    attendance_status ENUM('auto', 'manual', 'approved', 'rejected') DEFAULT 'auto',
    approved_by INT,
    approval_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id),
    UNIQUE KEY unique_staff_date (staff_id, attendance_date)
);

-- Target vs Achievement system
CREATE TABLE staff_targets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    target_period_type ENUM('monthly', 'quarterly', 'yearly'),
    target_period_start DATE,
    target_period_end DATE,
    sales_revenue_target DECIMAL(15,2) DEFAULT 0,
    transaction_count_target INT DEFAULT 0,
    customer_acquisition_target INT DEFAULT 0,
    avg_transaction_target DECIMAL(10,2) DEFAULT 0,
    category_targets JSON,
    target_status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id)
);

-- Achievement tracking
CREATE TABLE staff_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    target_id INT,
    achievement_date DATE,
    sales_revenue_achieved DECIMAL(15,2) DEFAULT 0,
    transaction_count_achieved INT DEFAULT 0,
    customer_acquisition_achieved INT DEFAULT 0,
    avg_transaction_achieved DECIMAL(10,2) DEFAULT 0,
    category_achievements JSON,
    overall_performance_percentage DECIMAL(5,2),
    achievement_incentive DECIMAL(10,2) DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id),
    FOREIGN KEY (target_id) REFERENCES staff_targets(id)
);

-- Salary calculations
CREATE TABLE staff_salaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    salary_month DATE,
    basic_salary DECIMAL(10,2),
    days_present INT,
    days_absent INT,
    sundays_worked INT,
    total_working_days INT,
    sunday_allowance DECIMAL(10,2),
    fixed_incentive DECIMAL(10,2),
    target_achievement_percentage DECIMAL(5,2),
    target_achievement_incentive DECIMAL(10,2),
    overtime_amount DECIMAL(10,2),
    attendance_deduction DECIMAL(10,2),
    other_allowances DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'hold') DEFAULT 'pending',
    payment_date DATE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id)
);

-- Device registration for attendance fraud prevention
CREATE TABLE staff_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    device_fingerprint VARCHAR(255) UNIQUE,
    device_info JSON,
    device_name VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id)
);
```

## 10. Automated Expense Entry System

### Promotional Expenses Auto-Generation
```sql
-- Unified promotional expenses system
CREATE TABLE promotional_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_type ENUM('owner_discount', 'loyalty_redemption', 'coupon_redemption'),
    reference_id INT,
    reference_type VARCHAR(50),
    amount DECIMAL(10,2),
    sale_id INT,
    customer_id INT,
    staff_id INT,
    description TEXT,
    expense_category VARCHAR(100) DEFAULT 'Promotional Discounts',
    created_by_system BOOLEAN DEFAULT TRUE,
    approved_status ENUM('auto_approved', 'pending', 'approved', 'rejected') DEFAULT 'auto_approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expense_type (expense_type),
    INDEX idx_sale_reference (sale_id)
);

-- Expense categories for financial tracking
CREATE TABLE expense_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(255),
    parent_id INT,
    description TEXT,
    auto_generated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 11. Advanced Point of Sale System

### Enhanced POS with All Discount Types
```sql
-- Sales table (enhanced)
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(100) UNIQUE,
    bill_series_id INT,
    customer_id INT,
    sale_date DATETIME,
    items JSON,
    subtotal DECIMAL(12,2),
    automatic_discounts DECIMAL(10,2) DEFAULT 0,
    manual_discounts DECIMAL(10,2) DEFAULT 0,
    owner_discount DECIMAL(10,2) DEFAULT 0,
    loyalty_discount DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    total_discounts DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2),
    due_amount DECIMAL(12,2) DEFAULT 0,
    payment_method ENUM('cash', 'card', 'upi', 'credit', 'mixed'),
    payment_status ENUM('paid', 'partial', 'pending') DEFAULT 'paid',
    sale_type ENUM('retail', 'wholesale', 'online'),
    loyalty_points_earned INT DEFAULT 0,
    cashier_id INT,
    logic_erp_synced BOOLEAN DEFAULT FALSE,
    logic_erp_bill_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bill_number (bill_number),
    INDEX idx_customer_sale (customer_id),
    INDEX idx_sale_date (sale_date)
);

-- Sales items with individual discounts
CREATE TABLE sales_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT,
    product_id INT,
    brand_id INT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    item_discount_amount DECIMAL(8,2) DEFAULT 0,
    item_discount_type VARCHAR(50),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(8,2),
    line_total DECIMAL(10,2),
    child_id INT,
    size VARCHAR(20),
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (child_id) REFERENCES customer_children(id)
);
```

## 12. WhatsApp Business Integration (Enhanced)

### Comprehensive WhatsApp System
```sql
-- WhatsApp configuration and templates
CREATE TABLE whatsapp_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(255) UNIQUE,
    template_category ENUM('bill', 'promotion', 'reminder', 'support', 'loyalty', 'coupon', 'reactivation'),
    language_code VARCHAR(10) DEFAULT 'en',
    header_type ENUM('text', 'image', 'document', 'video', 'none'),
    header_content TEXT,
    body_content TEXT NOT NULL,
    footer_content TEXT,
    button_type ENUM('none', 'quick_reply', 'call_to_action', 'url'),
    button_content JSON,
    variables JSON,
    template_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    whatsapp_template_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message tracking and analytics
CREATE TABLE whatsapp_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    phone_number VARCHAR(20),
    message_type ENUM('text', 'template', 'image', 'document', 'video', 'audio'),
    template_id INT,
    message_direction ENUM('outbound', 'inbound'),
    message_content TEXT,
    media_url VARCHAR(500),
    whatsapp_message_id VARCHAR(255),
    message_status ENUM('sent', 'delivered', 'read', 'failed', 'pending'),
    error_message TEXT,
    reference_type ENUM('sale', 'campaign', 'reminder', 'support', 'loyalty', 'coupon', 'reactivation'),
    reference_id INT,
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id)
);

-- Campaign management
CREATE TABLE whatsapp_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_name VARCHAR(255),
    campaign_type ENUM('promotional', 'loyalty', 'seasonal', 'reactivation', 'coupon'),
    template_id INT,
    target_audience JSON,
    scheduled_at TIMESTAMP,
    campaign_status ENUM('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled'),
    total_recipients INT DEFAULT 0,
    messages_sent INT DEFAULT 0,
    messages_delivered INT DEFAULT 0,
    messages_read INT DEFAULT 0,
    messages_failed INT DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id)
);
```

## 13. Advanced Financial Management

### Complete Financial Tracking
```sql
-- Cash flow management
CREATE TABLE cash_flow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_date DATE,
    transaction_type ENUM('inflow', 'outflow'),
    amount DECIMAL(15,2),
    source ENUM('sales', 'expense', 'petty_cash', 'bank_transfer', 'promotional_discount', 'other'),
    description TEXT,
    reference_id INT,
    reference_type VARCHAR(50),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank transactions
CREATE TABLE bank_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_account_id INT,
    transaction_date DATE,
    transaction_type ENUM('credit', 'debit'),
    amount DECIMAL(15,2),
    description TEXT,
    reference_number VARCHAR(100),
    balance_after DECIMAL(15,2),
    reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Petty cash management
CREATE TABLE petty_cash (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_date DATE,
    amount DECIMAL(10,2),
    transaction_type ENUM('issue', 'expense', 'return'),
    category_id INT,
    description TEXT,
    voucher_number VARCHAR(50),
    approved_by INT,
    created_by INT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outstanding management
CREATE TABLE company_outstanding (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    vendor_id INT,
    outstanding_type ENUM('receivable', 'payable'),
    amount DECIMAL(15,2),
    due_date DATE,
    bill_reference VARCHAR(100),
    description TEXT,
    status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 14. Kids Store Specific Features (Enhanced)

### Size Tracking and Growth Management
```sql
-- Seasonal collections for kids
CREATE TABLE seasonal_collections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    collection_name VARCHAR(255),
    season ENUM('spring', 'summer', 'monsoon', 'winter', 'festival'),
    age_group ENUM('infant', 'toddler', 'kids', 'pre_teen'),
    launch_date DATE,
    peak_sales_period JSON,
    discount_schedule JSON,
    inventory_targets JSON,
    is_active BOOLEAN DEFAULT TRUE
);

-- Size exchange and growth tracking
CREATE TABLE size_exchanges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_sale_id INT,
    child_id INT,
    original_size VARCHAR(20),
    new_size VARCHAR(20),
    exchange_reason ENUM('outgrown', 'wrong_size', 'preference_change'),
    exchange_date DATE,
    additional_payment DECIMAL(8,2) DEFAULT 0,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 15. Modern ERP Frontend Requirements

### Professional Interface Design (Odoo/SAP Style)
```
Enhanced ERP Navigation Structure:
├── 📊 Dashboard (Real-time metrics, AI insights, family analytics)
├── 🛒 Point of Sale (Advanced discounts, multi-child selection, brand integration)
├── 👥 CRM & Families (Multi-child profiles, growth tracking, loyalty management)
├── 👤 Staff Management (Attendance fraud prevention, targets, salary automation)
├── 📦 Inventory (Brand integration, AI forecasting, seasonal management)
├── 💰 Financial (Auto expense tracking, discount analysis, cash flow)
├── 🎯 Discount Manager (Rule engine, brand discounts, owner discounts)
├── 🎫 Coupon System (Auto-generation, time-based, redemption tracking)
├── 📱 WhatsApp Center (AI campaigns, reactivation, family communication)
├── 🤖 AI Center (FireAI insights, recommendations, performance analytics)
├── 📈 Reports & Analytics (AI-enhanced reporting, predictive insights)
├── 🔧 System Management (Daily backups, brand sync, AI model management)
└── ⚙️ Settings (Comprehensive configuration, automation rules, AI parameters)
```

### Dashboard Widgets (AI-Enhanced)
- Real-time sales with AI predictions and family analytics
- Customer activity with automated reactivation status
- Multi-child family insights and growth predictions
- Staff performance with AI-powered recommendations
- Inventory with demand forecasting and seasonal analysis
- Financial health with automated expense tracking
- Discount effectiveness with optimization suggestions
- WhatsApp campaign performance with engagement analytics
- AI recommendation system performance metrics
- Daily backup status and system health monitoring

## 16. Complete API Architecture

### Enhanced RESTful Endpoints
```
Authentication & Security:
/api/auth/* - JWT authentication with backup triggers
/api/backup/* - Daily backup management and monitoring

Customer & Family Management:
/api/customers/* - Enhanced family profile management
/api/children/* - Individual child profile management (up to 3)
/api/families/* - Family-wide analytics and insights

Sales & Commerce:
/api/pos/* - Advanced POS with all discount types
/api/sales/* - Sales management with AI insights
/api/returns/* - Enhanced return processing
/api/challans/* - Delivery note management

Discount & Promotion Management:
/api/discounts/* - Comprehensive discount rule engine
/api/owner-discounts/* - Store owner discount system
/api/coupons/* - Automated coupon generation and management
/api/loyalty/* - Payment-level loyalty redemption

Staff & HR Management:
/api/staff/* - Complete staff lifecycle management
/api/attendance/* - Fraud-proof attendance system
/api/targets/* - Target setting and achievement tracking
/api/salary/* - Automated salary calculation

Inventory & Brand Management:
/api/inventory/* - AI-enhanced inventory management
/api/brands/* - Brand integration and synchronization
/api/products/* - Product catalog with AI recommendations

Financial Management:
/api/financial/* - Comprehensive financial tracking
/api/expenses/* - Automated promotional expense entries
/api/outstanding/* - Receivables and payables management

AI & Intelligence:
/api/ai/* - FireAI recommendations and insights
/api/analytics/* - Predictive analytics and reporting
/api/insights/* - Customer and business intelligence

Communication:
/api/whatsapp/* - WhatsApp Business API integration
/api/campaigns/* - Marketing campaign management
/api/notifications/* - Automated notification system

System Management:
/api/integration/* - Logic ERP synchronization
/api/reports/* - Comprehensive reporting system
/api/admin/* - System administration and monitoring
```

## 17. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Daily backup system with login trigger
2. Logic ERP integration with brand synchronization
3. Enhanced customer management with multi-child support
4. Professional ERP frontend framework

### Phase 2: Core Business Logic (Week 3-4)
1. Advanced discount management system
2. Owner discount with automated expense entries
3. Payment-level loyalty redemption
4. Enhanced POS with all discount types

### Phase 3: AI & Automation (Week 5-6)
1. Custom FireAI recommendation engine
2. Automated coupon generation system
3. Staff management with fraud prevention
4. WhatsApp automation enhancement

### Phase 4: Advanced Features (Week 7-8)
1. Complete financial management integration
2. AI-powered analytics and insights
3. Professional reporting system
4. Mobile PWA optimization

## 18. Success Metrics & ROI Projections

### Expected Business Impact
- Customer reactivation: +70% with automated time-based coupons
- Average order value: +40% with AI recommendations and family profiles
- Staff productivity: +50% with fraud-proof attendance and automated calculations
- Inventory efficiency: +45% with AI demand forecasting and brand integration
- Customer retention: +60% with multi-child family management and loyalty
- Discount effectiveness: +35% with rule-based management and analytics
- System reliability: 99.95% uptime with daily automated backups
- Revenue growth: +25-30% within first year of implementation

### Technical Performance Standards
- API response time: <150ms for all endpoints
- AI prediction accuracy: >90% for product recommendations
- Backup success rate: 99.99% with automated verification
- Real-time sync latency: <3 seconds with Logic ERP
- Mobile performance: <2 second load times for PWA
- Data integrity: 100% with comprehensive validation
- Security score: Grade A with multi-layer fraud prevention

This ultimate specification creates a comprehensive, AI-powered business management system that integrates all your requirements into a single, professional platform that rivals expensive commercial ERP solutions while being specifically designed for kids clothing retail with advanced automation, AI intelligence, and robust operational features.