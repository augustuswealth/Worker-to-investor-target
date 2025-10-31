/**
 * ============================================
 * Augustus Wealth - Worker to Investor Challenge
 * Financial Calculator Application
 * 
 * @author Augustus Wealth LLC
 * @version 1.0.0
 * 
 * Table of Contents:
 * 1. Global Configuration
 * 2. Application State Management
 * 3. Utility Functions
 * 4. Tax Calculator Module
 * 5. Form Validation Module
 * 6. Chart Management Module
 * 7. Financial Calculator Module
 * 8. UI Controller Module
 * 9. Currency Input Handler
 * 10. Event Handlers
 * 11. Application Initialization
 * ============================================
 */

'use strict';

// ============================================
// 1. GLOBAL CONFIGURATION
// Central configuration for all app constants
// ============================================
const APP_CONFIG = {
    // 2024 Federal Tax Brackets
    TAX_BRACKETS: {
        single: [
            { threshold: 11925, rate: 0.10 },
            { threshold: 48475, rate: 0.12 },
            { threshold: 103350, rate: 0.22 },
            { threshold: 197300, rate: 0.24 },
            { threshold: 250525, rate: 0.32 },
            { threshold: 626350, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        marriedJointly: [
            { threshold: 23850, rate: 0.10 },
            { threshold: 96950, rate: 0.12 },
            { threshold: 206700, rate: 0.22 },
            { threshold: 394600, rate: 0.24 },
            { threshold: 501050, rate: 0.32 },
            { threshold: 751600, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        marriedSeparately: [
            { threshold: 11925, rate: 0.10 },
            { threshold: 48475, rate: 0.12 },
            { threshold: 103350, rate: 0.22 },
            { threshold: 197300, rate: 0.24 },
            { threshold: 250525, rate: 0.32 },
            { threshold: 375800, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ],
        headOfHousehold: [
            { threshold: 17000, rate: 0.10 },
            { threshold: 64850, rate: 0.12 },
            { threshold: 103350, rate: 0.22 },
            { threshold: 197300, rate: 0.24 },
            { threshold: 250500, rate: 0.32 },
            { threshold: 626350, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ]
    },
    
    // Financial Calculation Parameters
    FINANCIAL: {
        WEALTH_SPENDING_RATE: 0.05,      // 5% of wealth spent annually
        AFTER_TAX_SPENDING_RATE: 0.5,    // 50% of after-tax income for spending
        DEFAULT_SAVINGS_RATE: 0.1,       // 10% default savings assumption
        INVESTMENT_RETURN_RATE: 0.07,     // 7% annual return
        WITHDRAWAL_RATE: 0.05,            // 5% safe withdrawal rate
        PROJECTION_YEARS: 15,             // 15-year projection period
        CHALLENGE_RATE: 0.5,              // 50% savings challenge
        CHALLENGE_MONTHS: 6,              // 6-month challenge duration
        CAPITAL_GAINS_TAX_RATE: 0.2       // 20% capital gains tax
    },
    
    // Chart.js Configuration
    CHART: {
        COLORS: {
            primary: '#8cc63f',
            primaryDark: '#6fa02e',
            secondary: '#ea9d4b',
            secondaryDark: '#d18a3f',
            gray: '#8a9ba8',
            dark: '#2d2d2d',
            darker: '#1a1a1a',
            white: '#ffffff',
            error: '#e74c3c'
        },
        DEFAULTS: {
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontSize: 14,
            fontColor: '#ffffff',
            gridColor: 'rgba(255, 255, 255, 0.1)'
        }
    }
};

// ============================================
// 2. APPLICATION STATE MANAGEMENT
// Centralized state management for the app
// ============================================
class ApplicationState {
    constructor() {
        // User input values
        this.userInputs = {
            preTaxIncome: 0,
            wealthAccount: 0,
            stateIncomeTax: 0,
            filingStatus: ''
        };
        
        // Calculated results
        this.calculations = {
            federalTax: 0,
            totalTax: 0,
            afterTaxIncome: 0,
            targetSpending: 0,
            targetSaving: 0,
            estimatedSaving: 0,
            estimatedSpending: 0,
            wealthAccount: 0
        };
        
        // Chart instances
        this.charts = {
            income: null,
            spending: null,
            savings: null,
            projection: null,
            crossover: null
        };
        
        // Projection data arrays
        this.projectionData = {
            current: [],
            target: [],
            adjusted: []
        };
        
        // Crossover analysis data
        this.crossoverData = {
            worker: null,
            investor: null
        };
    }
    
    /**
     * Reset application state to initial values
     */
    reset() {
        // Destroy all existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Reset all data
        this.userInputs = {
            preTaxIncome: 0,
            wealthAccount: 0,
            stateIncomeTax: 0,
            filingStatus: ''
        };
        
        this.calculations = {
            federalTax: 0,
            totalTax: 0,
            afterTaxIncome: 0,
            targetSpending: 0,
            targetSaving: 0,
            estimatedSaving: 0,
            estimatedSpending: 0,
            wealthAccount: 0
        };
        
        this.projectionData = {
            current: [],
            target: [],
            adjusted: []
        };
        
        this.crossoverData = {
            worker: null,
            investor: null
        };
    }
}

// Initialize global state instance
const appState = new ApplicationState();

// ============================================
// 3. UTILITY FUNCTIONS
// Common helper functions used throughout app
// ============================================
const UtilityFunctions = {
    /**
     * Format number as USD currency
     * @param {number} value - Value to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },
    
    /**
     * Parse currency string to number
     * @param {string} value - Currency string to parse
     * @returns {number|string} Parsed number or empty string
     */
    parseCurrency(value) {
        if (!value || value === '') return '';
        
        // Remove all non-numeric characters except decimal and minus
        const cleaned = value.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        
        return isNaN(parsed) ? '' : parsed;
    },
    
    /**
     * Format decimal as percentage
     * @param {number} value - Decimal value (0.15 = 15%)
     * @returns {string} Formatted percentage
     */
    formatPercentage(value) {
        return `${Math.round(value * 100)}%`;
    },
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
};

// ============================================
// 4. TAX CALCULATOR MODULE
// Federal tax calculation based on IRS brackets
// ============================================
class TaxCalculator {
    /**
     * Calculate federal tax using 2024 tax brackets
     * @param {number} income - Annual gross income
     * @param {string} filingStatus - Tax filing status
     * @returns {number} Federal tax amount
     */
    static calculateFederalTax(income, filingStatus) {
        // Validate inputs
        if (income <= 0 || !APP_CONFIG.TAX_BRACKETS[filingStatus]) {
            return 0;
        }
        
        const brackets = APP_CONFIG.TAX_BRACKETS[filingStatus];
        let totalTax = 0;
        let previousThreshold = 0;
        
        // Calculate tax for each bracket
        for (const bracket of brackets) {
            if (income <= previousThreshold) break;
            
            const taxableInThisBracket = Math.min(income, bracket.threshold) - previousThreshold;
            totalTax += taxableInThisBracket * bracket.rate;
            previousThreshold = bracket.threshold;
        }
        
        return Math.round(totalTax);
    }
    
    /**
     * Calculate effective tax rate
     * @param {number} tax - Total tax amount
     * @param {number} income - Total income
     * @returns {number} Effective tax rate as decimal
     */
    static calculateEffectiveRate(tax, income) {
        if (income <= 0) return 0;
        return tax / income;
    }
}

// ============================================
// 5. FORM VALIDATION MODULE
// Input validation and error handling
// ============================================
class FormValidator {
    /**
     * Validate calculator form inputs
     * @param {Object} inputs - Form input values
     * @returns {Object} Validation errors object
     */
    static validateCalculatorForm(inputs) {
        const errors = {};
        
        // Validate gross income
        if (!inputs.preTaxIncome || inputs.preTaxIncome <= 0) {
            errors.preTaxIncome = 'Please enter a valid income amount';
        }
        
        // Validate wealth account
        if (inputs.wealthAccount === null || 
            inputs.wealthAccount === undefined || 
            inputs.wealthAccount === '') {
            errors.wealthAccount = 'Please enter your wealth account amount (enter $0 if none)';
        } else if (inputs.wealthAccount < 0) {
            errors.wealthAccount = 'Wealth account cannot be negative';
        }
        
        // Validate state tax
        if (inputs.stateIncomeTax < 0) {
            errors.stateIncomeTax = 'State tax cannot be negative';
        }
        
        // Validate filing status
        if (!inputs.filingStatus) {
            errors.filingStatus = 'Please select a filing status';
        }
        
        // Cross-field validation
        if (inputs.stateIncomeTax > inputs.preTaxIncome) {
            errors.stateIncomeTax = 'State tax cannot exceed income';
        }
        
        return errors;
    }
    
    /**
     * Display validation errors on form
     * @param {Object} errors - Validation errors
     * @param {string} formId - Form element ID
     * @returns {boolean} True if no errors
     */
    static displayErrors(errors, formId) {
        // Clear all previous errors
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Reset error states
        form.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
        
        form.querySelectorAll('.form-input, .form-select').forEach(el => {
            el.classList.remove('error');
        });
        
        // Display new errors
        Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            const errorElement = document.getElementById(`${fieldName}-error`);
            const inputElement = document.getElementById(fieldName);
            
            if (errorElement) {
                errorElement.textContent = errorMessage;
            }
            
            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
        
        return Object.keys(errors).length === 0;
    }
}

// ============================================
// 6. CHART MANAGEMENT MODULE
// Chart.js configuration and management
// ============================================
class ChartManager {
    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return window.innerWidth <= 768;
    }
    
    /**
     * Get responsive chart configuration
     * @returns {Object} Responsive chart config
     */
    static getResponsiveConfig() {
        const isMobile = this.isMobile();
        
        return {
            fontSize: isMobile ? 10 : 14,
            titleSize: isMobile ? 14 : 18,
            subtitleSize: isMobile ? 11 : 14,
            lineWidth: isMobile ? 2 : 3,
            gridLineWidth: isMobile ? 0.5 : 1,
            pointRadius: 0,
            pointHoverRadius: isMobile ? 4 : 6,
            legendPadding: isMobile ? 10 : 20,
            axisTitleSize: isMobile ? 11 : 12
        };
    }
    
    /**
     * Get default chart options
     * @returns {Object} Default chart configuration
     */
    static getDefaultOptions() {
        const config = this.getResponsiveConfig();
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                        font: {
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                            size: config.fontSize
                        },
                        padding: config.legendPadding
                    }
                },
                tooltip: {
                    titleFont: {
                        family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                        size: config.fontSize
                    },
                    bodyFont: {
                        family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                        size: config.fontSize
                    }
                }
            }
        };
    }
    
    /**
     * Create income breakdown doughnut chart
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} data - Chart data
     * @returns {Chart} Chart instance
     */
    static createIncomeChart(ctx, data) {
        const config = this.getResponsiveConfig();
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['After-tax Income', 'Federal Tax', 'State Tax'],
                datasets: [{
                    data: [
                        data.afterTaxIncome,
                        data.federalTax,
                        data.stateIncomeTax
                    ],
                    backgroundColor: [
                        APP_CONFIG.CHART.COLORS.primary,
                        APP_CONFIG.CHART.COLORS.dark,
                        APP_CONFIG.CHART.COLORS.gray
                    ],
                    borderWidth: 2,
                    borderColor: APP_CONFIG.CHART.COLORS.darker
                }]
            },
            options: {
                ...this.getDefaultOptions(),
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: true,
                        text: 'Income Breakdown',
                        color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                        font: { 
                            size: config.titleSize,
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            padding: config.legendPadding,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = UtilityFunctions.formatCurrency(context.raw);
                                return `${context.label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create comparison bar chart
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} title - Chart title
     * @param {Array} data - Chart data values
     * @returns {Chart} Chart instance
     */
    static createComparisonChart(ctx, title, data) {
        const config = this.getResponsiveConfig();
        
        // Create gradients for visual appeal
        const gradient1 = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient1.addColorStop(0, APP_CONFIG.CHART.COLORS.error);
        gradient1.addColorStop(1, APP_CONFIG.CHART.COLORS.secondary);
        
        const gradient2 = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient2.addColorStop(0, APP_CONFIG.CHART.COLORS.primary);
        gradient2.addColorStop(1, APP_CONFIG.CHART.COLORS.primaryDark);
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Worker Target', 'Investor Target'],
                datasets: [{
                    data: data,
                    backgroundColor: [gradient1, gradient2]
                }]
            },
            options: {
                ...this.getDefaultOptions(),
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: true,
                        text: title,
                        color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                        font: {
                            size: config.titleSize,
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily
                        }
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => UtilityFunctions.formatCurrency(context.raw)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            callback: (value) => UtilityFunctions.formatCurrency(value),
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            }
                        },
                        grid: {
                            color: APP_CONFIG.CHART.DEFAULTS.gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    /**
     * Create wealth projection line chart
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} data - Projection data
     * @returns {Chart} Chart instance
     */
    static createProjectionChart(ctx, data) {
        const config = this.getResponsiveConfig();
        const isMobile = this.isMobile();
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from(
                    { length: APP_CONFIG.FINANCIAL.PROJECTION_YEARS }, 
                    (_, i) => isMobile ? `${i + 1}` : `Year ${i + 1}`
                ),
                datasets: [
                    {
                        label: isMobile ? 'Worker' : 'Worker Savings Path',
                        data: data.current,
                        borderColor: APP_CONFIG.CHART.COLORS.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        tension: 0.3,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    },
                    {
                        label: isMobile ? 'Investor' : 'Investor Savings Path',
                        data: data.target,
                        borderColor: APP_CONFIG.CHART.COLORS.primary,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        tension: 0.3,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    },
                    {
                        label: isMobile ? 'You' : 'Your Savings Path',
                        data: data.adjusted,
                        borderColor: APP_CONFIG.CHART.COLORS.gray,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        tension: 0.3,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
                animation: {
                    duration: 0 // Disable animation for slider responsiveness
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: true,
                        text: isMobile 
                            ? '15-Year Projection' 
                            : `${APP_CONFIG.FINANCIAL.PROJECTION_YEARS}-Year Wealth Projection (${UtilityFunctions.formatPercentage(APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE)} annual return)`,
                        color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                        font: { 
                            size: config.titleSize,
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            padding: config.legendPadding,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            boxWidth: isMobile ? 30 : 40
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${UtilityFunctions.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: !isMobile,
                            text: 'Wealth Accumulation ($)',
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.axisTitleSize
                            }
                        },
                        ticks: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            callback: (value) => {
                                if (isMobile) {
                                    // Abbreviated format for mobile
                                    if (value >= 1000000) {
                                        return `$${(value / 1000000).toFixed(1)}M`;
                                    } else if (value >= 1000) {
                                        return `$${(value / 1000).toFixed(0)}k`;
                                    }
                                    return `$${value}`;
                                }
                                return UtilityFunctions.formatCurrency(value);
                            },
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            maxTicksLimit: isMobile ? 6 : 8
                        },
                        grid: {
                            color: APP_CONFIG.CHART.DEFAULTS.gridColor,
                            lineWidth: config.gridLineWidth
                        }
                    },
                    x: {
                        ticks: { 
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: isMobile ? 8 : 15
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    /**
     * Create financial independence crossover chart
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} data - Crossover data
     * @returns {Chart} Chart instance
     */
    static createCrossoverChart(ctx, data) {
        const config = this.getResponsiveConfig();
        const isMobile = this.isMobile();
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: isMobile ? 'Earned' : 'Earned Income (After-tax)',
                        data: data.earnedIncome,
                        borderColor: APP_CONFIG.CHART.COLORS.gray,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        borderDash: [5, 5],
                        tension: 0,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    },
                    {
                        label: isMobile ? 'Worker Passive' : 'Passive Income (Worker Path)',
                        data: data.workerPassive,
                        borderColor: APP_CONFIG.CHART.COLORS.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        tension: 0.3,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    },
                    {
                        label: isMobile ? 'Investor Passive' : 'Passive Income (Investor Path)',
                        data: data.investorPassive,
                        borderColor: APP_CONFIG.CHART.COLORS.primary,
                        backgroundColor: 'transparent',
                        borderWidth: config.lineWidth,
                        tension: 0.3,
                        pointRadius: config.pointRadius,
                        pointHoverRadius: config.pointHoverRadius
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: true,
                        text: isMobile ? 'Path to Independence' : 'Path to Financial Independence',
                        color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                        font: {
                            size: config.titleSize,
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                            weight: '300'
                        }
                    },
                    subtitle: {
                        display: !isMobile,
                        text: 'When passive income exceeds earned income, work becomes optional',
                        color: APP_CONFIG.CHART.COLORS.gray,
                        font: {
                            size: config.subtitleSize,
                            family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                            weight: '300'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            padding: config.legendPadding,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            boxWidth: isMobile ? 30 : 40
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${UtilityFunctions.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: !isMobile,
                            text: 'Annual Income ($)',
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.axisTitleSize
                            }
                        },
                        ticks: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            callback: (value) => {
                                if (isMobile) {
                                    if (value >= 1000000) {
                                        return `$${(value / 1000000).toFixed(1)}M`;
                                    } else if (value >= 1000) {
                                        return `$${(value / 1000).toFixed(0)}k`;
                                    }
                                    return `$${value}`;
                                }
                                return UtilityFunctions.formatCurrency(value);
                            },
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            maxTicksLimit: isMobile ? 6 : 8
                        },
                        grid: {
                            color: APP_CONFIG.CHART.DEFAULTS.gridColor,
                            lineWidth: config.gridLineWidth
                        }
                    },
                    x: {
                        title: {
                            display: !isMobile,
                            text: 'Years from Today',
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.axisTitleSize
                            }
                        },
                        ticks: {
                            color: APP_CONFIG.CHART.DEFAULTS.fontColor,
                            font: {
                                family: APP_CONFIG.CHART.DEFAULTS.fontFamily,
                                size: config.fontSize
                            },
                            stepSize: data.labels.length > 30 ? 5 : (data.labels.length > 20 ? 2 : 1),
                            maxRotation: 0,
                            autoSkip: true
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    /**
     * Update projection chart with new adjusted data
     * @param {Chart} chart - Chart instance to update
     * @param {Object} data - New projection data
     */
    static updateProjectionChart(chart, data) {
        const isMobile = this.isMobile();
        
        // Update the adjusted dataset
        chart.data.datasets[2].data = data.adjusted;
        chart.data.datasets[2].label = isMobile 
            ? `Adjusted (${UtilityFunctions.formatCurrency(data.adjustedSavings)})` 
            : `Your Savings Path (${UtilityFunctions.formatCurrency(data.adjustedSavings)})`;
        
        // Update without animation for smooth slider interaction
        chart.update('none');
    }
}

// ============================================
// 7. FINANCIAL CALCULATOR MODULE
// Core financial calculations and projections
// ============================================
class FinancialCalculator {
    /**
     * Calculate financial targets based on user inputs
     * @param {Object} inputs - User input values
     * @returns {Object} Calculated financial metrics
     */
    static calculate(inputs) {
        // Calculate taxes
        const federalTax = TaxCalculator.calculateFederalTax(
            inputs.preTaxIncome, 
            inputs.filingStatus
        );
        const totalTax = federalTax + inputs.stateIncomeTax;
        const afterTaxIncome = inputs.preTaxIncome - totalTax;
        
        // Handle wealth account (default to 0 if empty)
        const wealthAccount = inputs.wealthAccount === '' ? 0 : inputs.wealthAccount;
        
        // Calculate estimated current behavior (worker path)
        const estimatedSaving = inputs.preTaxIncome * APP_CONFIG.FINANCIAL.DEFAULT_SAVINGS_RATE;
        const estimatedSpending = afterTaxIncome - estimatedSaving;

        // Calculate initial investor targets
        let targetSpending = 
            (APP_CONFIG.FINANCIAL.AFTER_TAX_SPENDING_RATE * afterTaxIncome) + 
            (APP_CONFIG.FINANCIAL.WEALTH_SPENDING_RATE * wealthAccount);
        let targetSaving = Math.max(0, afterTaxIncome - targetSpending);

        // Ensure investor targets are always better than worker targets
        // If investor savings would be less than worker savings, match worker savings
        if (targetSaving < estimatedSaving) {
            targetSaving = estimatedSaving;
            targetSpending = afterTaxIncome - targetSaving;
        }

        // If investor spending would be more than worker spending, match worker spending
        if (targetSpending > estimatedSpending) {
            targetSpending = estimatedSpending;
            targetSaving = afterTaxIncome - targetSpending;
        }
        
        return {
            federalTax,
            totalTax,
            afterTaxIncome,
            targetSpending: Math.round(targetSpending),
            targetSaving: Math.round(targetSaving),
            estimatedSaving: Math.round(estimatedSaving),
            estimatedSpending: Math.round(estimatedSpending),
            wealthAccount
        };
    }
    
    /**
     * Calculate how many years an asset base will last with given spending
     * @param {number} annualSpending - Annual spending amount
     * @param {number} assetBase - Initial asset base
     * @param {number} yearsElapsed - Years counter (start with 0)
     * @returns {number} Years until depletion (-1 if sustainable indefinitely)
     */
    static calculateAssetEndurance(annualSpending, assetBase, yearsElapsed = 0) {
        // If spending is less than sustainable withdrawal rate, assets last forever
        if (annualSpending <= assetBase * APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE) {
            return -1; // Sustainable indefinitely
        }
        
        // Check if assets would be depleted this year
        if (assetBase - annualSpending <= 0) {
            return yearsElapsed + 1;
        }
        
        // Calculate next year's assets after spending and growth
        const remainingAssets = (assetBase - annualSpending) * 
            (1 + APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE);
        
        // Recursive call for next year
        return this.calculateAssetEndurance(
            annualSpending, 
            remainingAssets, 
            yearsElapsed + 1
        );
    }
    
    /**
     * Calculate wealth projection over specified years
     * @param {number} annualSaving - Annual saving amount
     * @param {number} years - Number of years to project
     * @param {number} startingBalance - Initial balance
     * @returns {Array} Array of projected values by year
     */
    static calculateProjection(annualSaving, years = APP_CONFIG.FINANCIAL.PROJECTION_YEARS, startingBalance = 0) {
        const projection = [];
        let balance = startingBalance;
        
        for (let year = 1; year <= years; year++) {
            // Add savings at beginning of year
            balance += annualSaving;
            // Apply investment growth
            balance = balance * (1 + APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE);
            projection.push(Math.round(balance));
        }
        
        return projection;
    }
    
    /**
     * Calculate final value after 15 years of saving and growth
     * @param {number} annualSaving - Annual saving amount
     * @param {number} startingBalance - Initial balance
     * @returns {number} Final projected value
     */
    static calculateFifteenYearValue(annualSaving, startingBalance = 0) {
        let balance = startingBalance;
        
        for (let i = 1; i <= APP_CONFIG.FINANCIAL.PROJECTION_YEARS; i++) {
            balance += annualSaving;
            balance = balance * (1 + APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE);
        }
        
        return Math.round(balance);
    }
    
    /**
     * Calculate crossover point when passive income exceeds earned income
     * @param {number} earnedIncome - Annual after-tax earned income
     * @param {number} currentAssets - Starting asset base
     * @param {number} annualSavings - Annual savings amount
     * @returns {Object} Crossover data including years and projection
     */
    static calculateCrossoverPoint(earnedIncome, currentAssets, annualSavings) {
        let assets = currentAssets;
        const projectionData = [];
        let crossoverYear = -1;
        
        // Check if already financially independent
        const startingPassiveIncome = currentAssets * APP_CONFIG.FINANCIAL.WITHDRAWAL_RATE;
        if (startingPassiveIncome >= earnedIncome) {
            crossoverYear = 0;
        }
        
        // Add year 0 (current state)
        projectionData.push({
            year: 0,
            assets: currentAssets,
            passiveIncome: startingPassiveIncome,
            earnedIncome: earnedIncome
        });
        
        // Project up to 50 years
        for (let year = 1; year <= 50; year++) {
            // Grow assets and add savings
            assets = assets * (1 + APP_CONFIG.FINANCIAL.INVESTMENT_RETURN_RATE) + annualSavings;
            const passiveIncome = assets * APP_CONFIG.FINANCIAL.WITHDRAWAL_RATE;
            
            projectionData.push({
                year: year,
                assets: assets,
                passiveIncome: passiveIncome,
                earnedIncome: earnedIncome
            });
            
            // Check for crossover
            if (passiveIncome >= earnedIncome && crossoverYear === -1) {
                crossoverYear = year;
            }
        }
        
        return {
            years: crossoverYear,
            projectionData: projectionData
        };
    }
    
    /**
     * Calculate all crossover scenarios
     * @param {Object} calculations - Calculated values from calculate()
     * @returns {Object} Crossover data for worker and investor paths
     */
    static calculateAllCrossoverPoints(calculations) {
        const afterTaxIncome = calculations.afterTaxIncome;
        const currentAssets = calculations.wealthAccount;
        
        // Worker path (estimated current behavior)
        const workerCrossover = this.calculateCrossoverPoint(
            afterTaxIncome,
            currentAssets,
            calculations.estimatedSaving
        );
        
        // Investor path (target behavior)
        const investorCrossover = this.calculateCrossoverPoint(
            afterTaxIncome,
            currentAssets,
            calculations.targetSaving
        );
        
        return {
            worker: workerCrossover,
            investor: investorCrossover
        };
    }
    
    /**
     * Calculate comprehensive asset endurance metrics
     * @param {Object} calculations - Calculated values from calculate()
     * @returns {Object} Asset endurance metrics
     */
    static calculateAssetEnduranceMetrics(calculations) {
        // Calculate 15-year projected wealth for both scenarios
        const workerWealth15Yr = this.calculateFifteenYearValue(
            calculations.estimatedSaving, 
            calculations.wealthAccount
        );
        const investorWealth15Yr = this.calculateFifteenYearValue(
            calculations.targetSaving, 
            calculations.wealthAccount
        );
        
        return {
            // Current asset endurance
            workerCurrentEndurance: this.calculateAssetEndurance(
                calculations.estimatedSpending, 
                calculations.wealthAccount
            ),
            investorCurrentEndurance: this.calculateAssetEndurance(
                calculations.targetSpending, 
                calculations.wealthAccount
            ),
            // Future asset endurance (15 years)
            workerFutureEndurance: this.calculateAssetEndurance(
                calculations.estimatedSpending, 
                workerWealth15Yr
            ),
            investorFutureEndurance: this.calculateAssetEndurance(
                calculations.targetSpending, 
                investorWealth15Yr
            ),
            // 15-year wealth values
            workerWealth15Yr,
            investorWealth15Yr
        };
    }
}

// ============================================
// 8. UI CONTROLLER MODULE
// User interface updates and DOM manipulation
// ============================================
class UIController {
    /**
     * Update all results displays
     */
    static updateResults() {
        const { calculations } = appState;
        
        // Update primary result cards
        document.getElementById('targetSpending').textContent = 
            UtilityFunctions.formatCurrency(calculations.targetSpending);
        document.getElementById('targetSaving').textContent = 
            UtilityFunctions.formatCurrency(calculations.targetSaving);
        
        // Check if user is already saving enough
        this.checkSavingsStatus();
        
        // Update challenge section
        const sixMonthChallenge = calculations.afterTaxIncome * 
            APP_CONFIG.FINANCIAL.CHALLENGE_RATE * 0.5;
        const monthlyChallenge = calculations.afterTaxIncome * 
            APP_CONFIG.FINANCIAL.CHALLENGE_RATE / 12;
        
        document.getElementById('challengeTotal').textContent = 
            UtilityFunctions.formatCurrency(sixMonthChallenge);
        document.getElementById('challengeMonthly').textContent = 
            UtilityFunctions.formatCurrency(monthlyChallenge);
        
        // Update all display sections
        this.updateSummaryTable();
        this.updateMonthsWorked();
        this.updateTaxAnalysisTable();
    }
    
    /**
     * Check if user is already achieving investor-level savings
     */
    static checkSavingsStatus() {
        const { calculations } = appState;
        
        if (calculations.estimatedSaving >= calculations.targetSaving) {
            // Calculate savings rate
            const savingsRate = (calculations.estimatedSaving / calculations.afterTaxIncome * 100).toFixed(1);
            
            // Update and show congratulations
            document.getElementById('congratulationsBanner').classList.remove('hidden');
        } else {
            document.getElementById('congratulationsBanner').classList.add('hidden');
        }
    }
    
    /**
     * Update income summary table
     */
    static updateSummaryTable() {
        const { userInputs, calculations } = appState;
        
        // Ensure wealth displays as 0 if empty
        const wealthAccount = userInputs.wealthAccount === '' ? 0 : userInputs.wealthAccount;
        
        document.getElementById('summaryPreTax').textContent = 
            UtilityFunctions.formatCurrency(userInputs.preTaxIncome);
        document.getElementById('summaryWealth').textContent = 
            UtilityFunctions.formatCurrency(wealthAccount);
        document.getElementById('summaryFedTax').textContent = 
            UtilityFunctions.formatCurrency(calculations.federalTax);
        document.getElementById('summaryStateTax').textContent = 
            UtilityFunctions.formatCurrency(userInputs.stateIncomeTax);
        document.getElementById('summaryTotalTax').textContent = 
            UtilityFunctions.formatCurrency(calculations.totalTax);
        document.getElementById('summaryPostTax').textContent = 
            UtilityFunctions.formatCurrency(calculations.afterTaxIncome);
        
        document.getElementById('incomeSummaryTable').classList.remove('hidden');
    }
    
    /**
     * Update months worked for taxes visualization
     */
    static updateMonthsWorked() {
        const { userInputs, calculations } = appState;
        
        // Calculate tax burden as portion of year
        const taxRate = calculations.totalTax / userInputs.preTaxIncome;
        const monthsWorked = Math.round(taxRate * 12 * 10) / 10;
        const fullMonthsWorked = Math.floor(monthsWorked);
        
        document.getElementById('monthsWorkedNumber').textContent = 
            `${monthsWorked.toFixed(1)} months per year`;
        
        // Create calendar visualization
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                           'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        
        monthNames.forEach((month, index) => {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'calendar-month';
            monthDiv.textContent = month;
            
            // Color based on tax burden
            if (index < fullMonthsWorked) {
                monthDiv.classList.add('tax-month');
            } else {
                monthDiv.classList.add('keep-month');
            }
            
            calendarGrid.appendChild(monthDiv);
        });
        
        document.getElementById('monthsWorkedStat').classList.remove('hidden');
    }
    
    /**
     * Update 15-year tax analysis comparison table
     */
    static updateTaxAnalysisTable() {
        const { userInputs, calculations } = appState;
        
        // Worker calculations (W2 income)
        const workerGrossIncome15 = userInputs.preTaxIncome * 15;
        const workerTaxImpact = calculations.totalTax * 15;
        const workerNetIncome15 = calculations.afterTaxIncome * 15;
        
        // Investor calculations (capital gains)
        const investorWealth15Yr = FinancialCalculator.calculateFifteenYearValue(
            calculations.targetSaving, 
            calculations.wealthAccount
        );
        
        // Calculate gains (not including principal)
        const totalContributions = calculations.wealthAccount + (calculations.targetSaving * 15);
        const investorIncomeGains = investorWealth15Yr - totalContributions;
        
        // Capital gains tax
        const investorGrossIncome15 = investorIncomeGains;
        const investorTaxImpact = investorIncomeGains * APP_CONFIG.FINANCIAL.CAPITAL_GAINS_TAX_RATE;
        const investorNetIncome15 = investorIncomeGains * (1 - APP_CONFIG.FINANCIAL.CAPITAL_GAINS_TAX_RATE);
        
        // Calculate effective rates
        const workerTaxRate = (calculations.totalTax / userInputs.preTaxIncome * 100).toFixed(1);
        const investorTaxRate = "20.0"; // Fixed capital gains rate
        
        // Update gross income row
        document.getElementById('workerGrossIncome15').textContent = 
            UtilityFunctions.formatCurrency(workerGrossIncome15);
        document.getElementById('investorGrossIncome15').textContent = 
            UtilityFunctions.formatCurrency(investorGrossIncome15);
        const grossDiff = investorGrossIncome15 - workerGrossIncome15;
        document.getElementById('grossIncomeDifference').textContent = 
            UtilityFunctions.formatCurrency(Math.abs(grossDiff));
        document.getElementById('grossIncomeDifference').className = 
            grossDiff >= 0 ? 'difference-column positive' : 'difference-column negative';
        
        // Update tax impact row
        document.getElementById('workerTaxImpact').textContent = 
            UtilityFunctions.formatCurrency(workerTaxImpact);
        document.getElementById('investorTaxImpact').textContent = 
            UtilityFunctions.formatCurrency(investorTaxImpact);
        const taxDiff = investorTaxImpact - workerTaxImpact;
        document.getElementById('taxImpactDifference').textContent = 
            UtilityFunctions.formatCurrency(Math.abs(taxDiff));
        document.getElementById('taxImpactDifference').className = 
            taxDiff <= 0 ? 'difference-column positive' : 'difference-column negative';
        
        // Update net income row
        document.getElementById('workerNetIncome15').textContent = 
            UtilityFunctions.formatCurrency(workerNetIncome15);
        document.getElementById('investorNetIncome15').textContent = 
            UtilityFunctions.formatCurrency(investorNetIncome15);
        const netDiff = investorNetIncome15 - workerNetIncome15;
        document.getElementById('netIncomeDifference').textContent = 
            UtilityFunctions.formatCurrency(Math.abs(netDiff));
        document.getElementById('netIncomeDifference').className = 
            netDiff >= 0 ? 'difference-column positive' : 'difference-column negative';
        
        // Update tax rates
        document.getElementById('workerTaxRate').textContent = `${workerTaxRate}%`;
        document.getElementById('investorTaxRate').textContent = `${investorTaxRate}%`;
        const rateDiff = parseFloat(investorTaxRate) - parseFloat(workerTaxRate);
        document.getElementById('taxRateDifference').textContent = `${Math.abs(rateDiff).toFixed(1)}%`;
        document.getElementById('taxRateDifference').className = 
            rateDiff <= 0 ? 'difference-column positive' : 'difference-column negative';
        
        // Update years worked for taxes
        const workerYearsForTaxes = (parseFloat(workerTaxRate) / 100 * 15).toFixed(1);
        const investorYearsForTaxes = "3.0"; // 20% * 15 years = 3 years
        
        document.getElementById('workerYearsForTaxes').textContent = `${workerYearsForTaxes} years`;
        document.getElementById('investorYearsForTaxes').textContent = `${investorYearsForTaxes} years`;
        
        const yearsDiff = parseFloat(workerYearsForTaxes) - parseFloat(investorYearsForTaxes);
        document.getElementById('yearsForTaxesDifference').textContent = `${Math.abs(yearsDiff).toFixed(1)} years`;
        document.getElementById('yearsForTaxesDifference').className = 
            yearsDiff >= 0 ? 'difference-column positive' : 'difference-column negative';
        
        document.getElementById('taxAnalysisSection').classList.remove('hidden');
    }
    
    /**
     * Update all chart visualizations
     */
    static updateCharts() {
        const { userInputs, calculations, charts } = appState;
        
        // Destroy existing charts
        Object.entries(charts).forEach(([key, chart]) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
                appState.charts[key] = null;
            }
        });
        
        // Show income chart wrapper
        document.getElementById('incomeChartWrapper').classList.remove('hidden');
        
        // Create income breakdown chart
        const incomeCtx = document.getElementById('incomeChart').getContext('2d');
        appState.charts.income = ChartManager.createIncomeChart(incomeCtx, {
            afterTaxIncome: calculations.afterTaxIncome,
            federalTax: calculations.federalTax,
            stateIncomeTax: userInputs.stateIncomeTax
        });
        
        // Create spending comparison chart
        const spendingCtx = document.getElementById('spendingChart');
        if (spendingCtx) {
            appState.charts.spending = ChartManager.createComparisonChart(
                spendingCtx.getContext('2d'),
                'Spending Comparison',
                [calculations.estimatedSpending, calculations.targetSpending]
            );
        }
        
        // Create savings comparison chart
        const savingsCtx = document.getElementById('savingsChart');
        if (savingsCtx) {
            appState.charts.savings = ChartManager.createComparisonChart(
                savingsCtx.getContext('2d'),
                'Savings Comparison',
                [calculations.estimatedSaving, calculations.targetSaving]
            );
        }
    }
    
    /**
     * Initialize wealth projection section
     */
    static initializeProjection() {
        const { calculations } = appState;
        
        const slider = document.getElementById('savingsSlider');
        if (!slider) return;
        
        // Configure slider
        slider.max = calculations.afterTaxIncome;
        slider.step = Math.max(1000, Math.round(calculations.afterTaxIncome / 100));
        slider.value = Math.round((calculations.estimatedSaving + calculations.targetSaving) / 2);
        
        // Calculate initial projections
        appState.projectionData = {
            current: FinancialCalculator.calculateProjection(
                calculations.estimatedSaving, 
                APP_CONFIG.FINANCIAL.PROJECTION_YEARS, 
                calculations.wealthAccount
            ),
            target: FinancialCalculator.calculateProjection(
                calculations.targetSaving, 
                APP_CONFIG.FINANCIAL.PROJECTION_YEARS, 
                calculations.wealthAccount
            ),
            adjusted: FinancialCalculator.calculateProjection(
                parseInt(slider.value), 
                APP_CONFIG.FINANCIAL.PROJECTION_YEARS, 
                calculations.wealthAccount
            )
        };
        
        this.updateProjectionStats();
        this.createProjectionChart();
    }
    
    /**
     * Update projection statistics display
     */
    static updateProjectionStats() {
        const { calculations } = appState;
        const slider = document.getElementById('savingsSlider');
        const adjustedSavings = slider ? parseInt(slider.value) : 0;
        
        // Update slider display
        const sliderDisplay = document.getElementById('sliderValueDisplay');
        if (sliderDisplay) {
            sliderDisplay.textContent = UtilityFunctions.formatCurrency(adjustedSavings);
        }
        
        // Update stat cards
        const currentSavings = document.getElementById('currentSavings');
        if (currentSavings) {
            currentSavings.textContent = UtilityFunctions.formatCurrency(calculations.estimatedSaving);
            currentSavings.classList.add('highlight-secondary');
        }
        
        const targetSavingsStat = document.getElementById('targetSavingsStat');
        if (targetSavingsStat) {
            targetSavingsStat.textContent = UtilityFunctions.formatCurrency(calculations.targetSaving);
        }
        
        const savingsGap = document.getElementById('savingsGap');
        if (savingsGap) {
            savingsGap.textContent = UtilityFunctions.formatCurrency(
                calculations.targetSaving - calculations.estimatedSaving
            );
            savingsGap.classList.add('highlight-red');
        }
        
        const projectedWealth = document.getElementById('projectedWealth');
        if (projectedWealth) {
            const projectedValue = FinancialCalculator.calculateFifteenYearValue(
                adjustedSavings, 
                calculations.wealthAccount
            );
            projectedWealth.textContent = UtilityFunctions.formatCurrency(projectedValue);
            projectedWealth.classList.remove('highlight');
            projectedWealth.classList.add('highlight-gray');
        }
    }
    
    /**
     * Create projection chart
     */
    static createProjectionChart() {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;
        
        appState.charts.projection = ChartManager.createProjectionChart(
            ctx.getContext('2d'), 
            appState.projectionData
        );
    }
    
    /**
     * Update projection chart with new data
     */
    static updateProjectionChart() {
        const { calculations } = appState;
        const slider = document.getElementById('savingsSlider');
        const adjustedSavings = slider ? parseInt(slider.value) : 0;
        
        // Recalculate adjusted projection
        appState.projectionData.adjusted = FinancialCalculator.calculateProjection(
            adjustedSavings, 
            APP_CONFIG.FINANCIAL.PROJECTION_YEARS, 
            calculations.wealthAccount
        );
        appState.projectionData.adjustedSavings = adjustedSavings;
        
        if (appState.charts.projection) {
            ChartManager.updateProjectionChart(appState.charts.projection, appState.projectionData);
        }
    }
    
    /**
     * Initialize crossover analysis section
     */
    static initializeCrossover() {
        const { calculations } = appState;
        
        // Calculate crossover points
        appState.crossoverData = FinancialCalculator.calculateAllCrossoverPoints(calculations);
        
        // Update displays
        this.updateCrossoverStats();
        this.createCrossoverChart();
        
        // Show section
        document.getElementById('crossover').classList.remove('hidden');
    }
    
    /**
     * Update crossover statistics display
     */
    static updateCrossoverStats() {
        const { crossoverData, calculations } = appState;
        
        // Format years for display
        const formatYears = (years) => {
            if (years === -1) return 'Never';
            if (years === 0) return 'Already Free!';
            return `${years} years`;
        };
        
        // Worker path
        document.getElementById('workerCrossoverYears').textContent = 
            formatYears(crossoverData.worker.years);
        document.getElementById('workerCrossoverSavings').textContent = 
            UtilityFunctions.formatCurrency(calculations.estimatedSaving);
        
        // Investor path
        document.getElementById('investorCrossoverYears').textContent = 
            formatYears(crossoverData.investor.years);
        document.getElementById('investorCrossoverSavings').textContent = 
            UtilityFunctions.formatCurrency(calculations.targetSaving);
        
        // Difference calculations
        if (crossoverData.worker.years !== -1 && crossoverData.investor.years !== -1) {
            const yearsSaved = crossoverData.worker.years - crossoverData.investor.years;
            document.getElementById('crossoverDifference').textContent = `${yearsSaved} years`;
            document.getElementById('extraSavingsNeeded').textContent = 
                UtilityFunctions.formatCurrency(calculations.targetSaving - calculations.estimatedSaving);
            document.getElementById('freedomGained').textContent = `${yearsSaved} years`;
        } else {
            document.getElementById('crossoverDifference').textContent = 'N/A';
            document.getElementById('extraSavingsNeeded').textContent = 
                UtilityFunctions.formatCurrency(calculations.targetSaving - calculations.estimatedSaving);
            document.getElementById('freedomGained').textContent = 'Infinite';
        }
    }
    
    /**
     * Create crossover visualization chart
     */
    static createCrossoverChart() {
        const ctx = document.getElementById('crossoverChart');
        if (!ctx) return;
        
        const { crossoverData, calculations } = appState;
        
        // Determine optimal viewing window
        let maxYears = 30;
        const workerCrossover = crossoverData.worker.years;
        const investorCrossover = crossoverData.investor.years;
        
        if (workerCrossover > 0 && workerCrossover !== -1) {
            maxYears = Math.min(50, Math.max(maxYears, Math.ceil(workerCrossover * 1.3)));
        }
        if (investorCrossover > 0 && investorCrossover !== -1) {
            maxYears = Math.min(50, Math.max(20, Math.ceil(investorCrossover * 1.5)));
        }
        
        // Zoom in for early crossovers
        if (workerCrossover !== -1 && workerCrossover <= 10 && 
            investorCrossover !== -1 && investorCrossover <= 10) {
            maxYears = 15;
        }
        
        // Prepare chart data
        const labels = Array.from({length: maxYears + 1}, (_, i) => i);
        const earnedIncome = Array(maxYears + 1).fill(calculations.afterTaxIncome);
        
        const workerPassive = crossoverData.worker.projectionData
            .slice(0, maxYears + 1)
            .map(d => d.passiveIncome);
        
        const investorPassive = crossoverData.investor.projectionData
            .slice(0, maxYears + 1)
            .map(d => d.passiveIncome);
        
        const chartData = {
            labels: labels,
            earnedIncome: earnedIncome,
            workerPassive: workerPassive,
            investorPassive: investorPassive
        };
        
        appState.charts.crossover = ChartManager.createCrossoverChart(ctx.getContext('2d'), chartData);
    }
    
    /**
     * Update asset endurance analysis
     */
    static updateAssetEndurance() {
        const { calculations, crossoverData } = appState;
        
        // Calculate endurance metrics
        const endurance = FinancialCalculator.calculateAssetEnduranceMetrics(calculations);
        
        // Update annual spending row
        const workerSpendingEl = document.getElementById('workerAnnualSpending');
        if (workerSpendingEl) {
            workerSpendingEl.textContent = UtilityFunctions.formatCurrency(calculations.estimatedSpending);
        }
        
        const investorSpendingEl = document.getElementById('investorAnnualSpending');
        if (investorSpendingEl) {
            investorSpendingEl.textContent = UtilityFunctions.formatCurrency(calculations.targetSpending);
        }
        
        const spendingDiff = calculations.estimatedSpending - calculations.targetSpending;
        const spendingDiffEl = document.getElementById('annualSpendingDiff');
        if (spendingDiffEl) {
            spendingDiffEl.textContent = UtilityFunctions.formatCurrency(Math.abs(spendingDiff));
            spendingDiffEl.className = spendingDiff >= 0 ? 'endurance-diff positive' : 'endurance-diff negative';
        }
        
        // Update current asset base row
        document.getElementById('currentAssetAmount').textContent = 
            `(${UtilityFunctions.formatCurrency(calculations.wealthAccount)})`;
        
        // Format endurance values
        const formatEndurance = (years) => {
            if (years === -1) return 'Indefinite';
            if (years === 0) return 'N/A';
            return `${years} years`;
        };
        
        // Update current endurance values
        const workerCurrentEl = document.getElementById('workerCurrentEndurance');
        if (workerCurrentEl) {
            workerCurrentEl.textContent = formatEndurance(endurance.workerCurrentEndurance);
            if (endurance.workerCurrentEndurance === -1) {
                workerCurrentEl.classList.add('highlight');
            }
        }
        
        const investorCurrentEl = document.getElementById('investorCurrentEndurance');
        if (investorCurrentEl) {
            investorCurrentEl.textContent = formatEndurance(endurance.investorCurrentEndurance);
            if (endurance.investorCurrentEndurance === -1) {
                investorCurrentEl.classList.add('highlight');
            }
        }
        
        // Calculate and display current difference
        const currentDiff = this.calculateEnduranceDifference(
            endurance.workerCurrentEndurance, 
            endurance.investorCurrentEndurance
        );
        const currentDiffEl = document.getElementById('currentEnduranceDiff');
        if (currentDiffEl) {
            currentDiffEl.textContent = currentDiff.text;
            currentDiffEl.className = `endurance-diff ${currentDiff.className}`;
        }
        
        // Update future asset base row
        document.getElementById('futureAssetAmount').textContent = 
            `Worker: ${UtilityFunctions.formatCurrency(endurance.workerWealth15Yr)} | Investor: ${UtilityFunctions.formatCurrency(endurance.investorWealth15Yr)}`;
        
        // Update future endurance values
        const workerFutureEl = document.getElementById('workerFutureEndurance');
        if (workerFutureEl) {
            workerFutureEl.textContent = formatEndurance(endurance.workerFutureEndurance);
            if (endurance.workerFutureEndurance === -1) {
                workerFutureEl.classList.add('highlight');
            }
        }
        
        const investorFutureEl = document.getElementById('investorFutureEndurance');
        if (investorFutureEl) {
            investorFutureEl.textContent = formatEndurance(endurance.investorFutureEndurance);
            if (endurance.investorFutureEndurance === -1) {
                investorFutureEl.classList.add('highlight');
            }
        }
        
        // Calculate and display future difference
        const futureDiff = this.calculateEnduranceDifference(
            endurance.workerFutureEndurance, 
            endurance.investorFutureEndurance
        );
        const futureDiffEl = document.getElementById('futureEnduranceDiff');
        if (futureDiffEl) {
            futureDiffEl.textContent = futureDiff.text;
            futureDiffEl.className = `endurance-diff ${futureDiff.className}`;
        }
        
        // Update crossover row
        const formatCrossover = (years) => {
            if (years === -1) return 'Never';
            if (years === 0) return 'Already Free!';
            return `${years} years`;
        };
        
        document.getElementById('workerCrossoverEndurance').textContent = 
            formatCrossover(crossoverData.worker.years);
        document.getElementById('investorCrossoverEndurance').textContent = 
            formatCrossover(crossoverData.investor.years);
        
        // Calculate crossover difference
        if (crossoverData.worker.years !== -1 && crossoverData.investor.years !== -1) {
            const diff = crossoverData.worker.years - crossoverData.investor.years;
            document.getElementById('crossoverEnduranceDiff').textContent = `${diff} years faster`;
            document.getElementById('crossoverEnduranceDiff').className = 'endurance-diff positive';
        } else if (crossoverData.investor.years !== -1 && crossoverData.worker.years === -1) {
            document.getElementById('crossoverEnduranceDiff').textContent = 'Investor achieves freedom';
            document.getElementById('crossoverEnduranceDiff').className = 'endurance-diff positive';
        } else {
            document.getElementById('crossoverEnduranceDiff').textContent = 'N/A';
            document.getElementById('crossoverEnduranceDiff').className = 'endurance-diff';
        }
        
        // Generate insights
        this.generateEnduranceInsights(endurance, calculations, crossoverData);
        
        // Show section
        document.getElementById('summary').classList.remove('hidden');
    }
    
    /**
     * Calculate endurance difference formatting
     * @param {number} workerEndurance - Worker path endurance
     * @param {number} investorEndurance - Investor path endurance
     * @returns {Object} Formatted text and CSS class
     */
    static calculateEnduranceDifference(workerEndurance, investorEndurance) {
        if (workerEndurance === -1 && investorEndurance === -1) {
            return { text: 'Both indefinite', className: 'positive' };
        } else if (investorEndurance === -1 && workerEndurance !== -1) {
            return { text: 'Investor: Indefinite', className: 'positive' };
        } else if (workerEndurance === -1 && investorEndurance !== -1) {
            return { text: 'Worker: Indefinite', className: 'negative' };
        } else if (workerEndurance === 0 || investorEndurance === 0) {
            return { text: 'N/A', className: '' };
        } else {
            const diff = investorEndurance - workerEndurance;
            const sign = diff > 0 ? '+' : '';
            return { 
                text: `${sign}${diff} years`, 
                className: diff > 0 ? 'positive' : 'negative' 
            };
        }
    }
    
    /**
     * Generate insights based on calculations
     */
    static generateEnduranceInsights(endurance, calculations, crossoverData) {
        const insights = [];
        
        // Crossover insight
        if (crossoverData.worker.years !== -1 && crossoverData.investor.years !== -1) {
            const yearsSaved = crossoverData.worker.years - crossoverData.investor.years;
            insights.push(`Following the investor path achieves financial independence ${yearsSaved} years earlier`);
        } else if (crossoverData.investor.years !== -1 && crossoverData.worker.years === -1) {
            insights.push('Only the investor path leads to financial independence within 50 years');
        }
        
        // Current asset insights
        if (calculations.wealthAccount > 0) {
            if (endurance.investorCurrentEndurance === -1) {
                insights.push('Your current assets can sustain investor-level spending indefinitely!');
            } else if (endurance.workerCurrentEndurance > 0 && endurance.investorCurrentEndurance > 0) {
                const diff = endurance.investorCurrentEndurance - endurance.workerCurrentEndurance;
                if (diff > 0) {
                    insights.push(`Investor spending patterns would make your current assets last ${diff} year(s) longer`);
                }
            }
        }
        
        // Future asset insights
        if (endurance.investorFutureEndurance === -1 && endurance.workerFutureEndurance !== -1) {
            insights.push('Following the investor path for 15 years would give you indefinite financial freedom');
        } else if (endurance.investorFutureEndurance > 0 && endurance.workerFutureEndurance > 0) {
            const yearsDiff = endurance.investorFutureEndurance - endurance.workerFutureEndurance;
            if (yearsDiff > 0) {
                insights.push(`Investor habits would extend your future asset endurance by ${yearsDiff} years`);
            }
        }
        
        // Wealth accumulation insight
        const wealthDiff = endurance.investorWealth15Yr - endurance.workerWealth15Yr;
        if (wealthDiff > 0) {
            insights.push(`Following investor principles would accumulate ${UtilityFunctions.formatCurrency(wealthDiff)} more wealth over 15 years`);
        }
        
        // Spending reduction insight
        const spendingReduction = ((calculations.estimatedSpending - calculations.targetSpending) / calculations.estimatedSpending * 100).toFixed(0);
        if (spendingReduction > 0) {
            insights.push(`Reducing spending by ${spendingReduction}% aligns you with investor principles`);
        }
        
        // Update insights list
        const insightsList = document.getElementById('enduranceInsights');
        if (insightsList) {
            insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
        }
    }
    
    /**
     * Show all sections after calculation
     */
    static showAllSections() {
        const sections = ['comparison', 'projection', 'crossover', 'summary', 'challenge', 'contact', 'expandableInfo'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('hidden');
            }
        });
    }
}

// ============================================
// 9. CURRENCY INPUT HANDLER
// Handles currency formatting for input fields
// ============================================
class CurrencyInputHandler {
    constructor(inputElement) {
        this.input = inputElement;
        this.previousValue = '';
        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        this.input.addEventListener('keypress', this.handleKeypress.bind(this));
    }
    
    /**
     * Handle keypress events - restrict to numbers
     */
    handleKeypress(e) {
        const char = String.fromCharCode(e.which);
        
        // Allow numbers, backspace, delete, arrow keys
        if (e.which < 48 || e.which > 57) {
            if (e.which !== 8 && e.which !== 46 && e.which !== 37 && e.which !== 39) {
                e.preventDefault();
            }
        }
    }
    
    /**
     * Handle input events - format as user types
     */
    handleInput(e) {
        let value = this.input.value;
        
        // Remove all non-numeric characters
        value = value.replace(/[^0-9]/g, '');
        
        // Convert to number
        const numValue = parseInt(value) || 0;
        
        // Update input with formatted value
        if (numValue > 0) {
            this.input.value = this.formatLive(numValue);
        } else {
            this.input.value = '';
        }
        
        // Maintain cursor position
        const cursorPosition = this.input.selectionStart;
        setTimeout(() => {
            this.input.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    }
    
    /**
     * Handle blur events - full formatting
     */
    handleBlur() {
        const value = UtilityFunctions.parseCurrency(this.input.value);
        
        if (value > 0) {
            this.input.value = UtilityFunctions.formatCurrency(value);
        } else if (value === 0 && this.input.id === 'wealthAccount') {
            this.input.value = '$0';
        } else {
            this.input.value = '';
        }
    }
    
    /**
     * Handle focus events - prepare for editing
     */
    handleFocus() {
        const value = UtilityFunctions.parseCurrency(this.input.value);
        if (value >= 0) {
            this.input.value = value.toString();
        }
    }
    
    /**
     * Format value for live display
     */
    formatLive(value) {
        return '$' + value.toLocaleString('en-US');
    }
}

// ============================================
// 10. EVENT HANDLERS
// Application event handling functions
// ============================================

/**
 * Handle calculator form submission
 */
function handleCalculatorSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const inputs = {
        preTaxIncome: UtilityFunctions.parseCurrency(this.preTaxIncome.value),
        wealthAccount: this.wealthAccount.value === '' ? '' : UtilityFunctions.parseCurrency(this.wealthAccount.value),
        stateIncomeTax: UtilityFunctions.parseCurrency(this.stateIncomeTax.value) || 0,
        filingStatus: this.filingStatus.value
    };
    
    // Validate inputs
    const errors = FormValidator.validateCalculatorForm(inputs);
    if (!FormValidator.displayErrors(errors, 'calculatorForm')) {
        return;
    }
    
    // Store inputs and calculate
    appState.userInputs = inputs;
    appState.calculations = FinancialCalculator.calculate(inputs);
    
    // Update UI
    UIController.updateResults();
    UIController.updateCharts();
    UIController.initializeProjection();
    UIController.initializeCrossover();
    UIController.updateAssetEndurance();
    UIController.showAllSections();
}

/**
 * Handle savings slider input
 */
function handleSavingsSliderInput() {
    UIController.updateProjectionStats();
    UIController.updateProjectionChart();
}

/**
 * Handle window resize for responsive charts
 */
let resizeTimeout;
function handleWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Only update if screen size category changed
        const wasMobile = window.innerWidth > 768;
        const isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== isMobile && appState.calculations.afterTaxIncome) {
            // Recreate charts with new responsive settings
            UIController.updateCharts();
            
            if (appState.projectionData.current.length > 0) {
                UIController.createProjectionChart();
            }
            
            if (appState.crossoverData.worker) {
                UIController.createCrossoverChart();
            }
        }
    }, 250);
}

// ============================================
// 11. APPLICATION INITIALIZATION
// Initialize app when DOM is ready
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize currency input handlers
    document.querySelectorAll('.currency-input').forEach(input => {
        new CurrencyInputHandler(input);
    });
    
    // Set up form submission handler
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', handleCalculatorSubmit);
    }
    
    // Set up savings slider handler
    const savingsSlider = document.getElementById('savingsSlider');
    if (savingsSlider) {
        savingsSlider.addEventListener('input', handleSavingsSliderInput);
    }
    
    // Set up window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Set up global Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = APP_CONFIG.CHART.DEFAULTS.fontFamily;
        Chart.defaults.color = APP_CONFIG.CHART.DEFAULTS.fontColor;
    }

    // Set up expandable section handlers
    function initializeExpandableSections() {
        const expandableHeaders = document.querySelectorAll('.expandable-header');
        
        expandableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const section = this.parentElement;
                section.classList.toggle('expanded');
            });
        });
    }

    // Initialize expandable sections if they exist on the page
    if (document.querySelector('.expandable-container')) {
        initializeExpandableSections();
    }
});