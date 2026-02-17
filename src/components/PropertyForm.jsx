import { useState } from 'react';

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'Australian Capital Territory' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', multiplier: 52 / 12 },
  { value: 'fortnightly', label: 'Fortnightly', multiplier: 26 / 12 },
  { value: 'monthly', label: 'Monthly', multiplier: 1 },
  { value: 'quarterly', label: 'Quarterly', multiplier: 4 / 12 },
  { value: 'half-yearly', label: 'Half Yearly', multiplier: 2 / 12 },
  { value: 'yearly', label: 'Yearly', multiplier: 1 / 12 },
];

function PropertyForm({ onCalculate }) {
  const [formData, setFormData] = useState({
    // Property details
    propertyAddress: '',
    purchasePrice: '',
    deposit: '',
    depositPercentage: '20',
    lmi: '0',
    state: 'NSW',
    isFirstHome: false,
    
    // Loan details
    interestRate: '',
    loanTerm: '30',
    
    // Income
    weeklyRent: '',
    weeksRented: '52',
    
    // Expenses with frequencies
    propertyManagementFee: '8',
    councilRates: '2000',
    councilRatesFreq: 'yearly',
    waterRates: '800',
    waterRatesFreq: 'yearly',
    insurance: '1200',
    insuranceFreq: 'yearly',
    maintenance: '1500',
    maintenanceFreq: 'yearly',
    emergencyServicesLevy: '',
    emergencyServicesLevyFreq: 'yearly',
    landTax: '',
    landTaxFreq: 'yearly',
    wealthFee: '',
    wealthFeeFreq: 'monthly',
    strata: '',
    strataFreq: 'quarterly',
    
    // Growth assumptions
    capitalGrowthRate: '5',
    rentalGrowthRate: '3',
    
    // Options
    includeStressTests: true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let updates = { [name]: type === 'checkbox' ? checked : value };
    
    // Handle deposit and percentage calculations
    if (name === 'deposit' && value && formData.purchasePrice) {
      const depositAmount = parseFloat(value);
      const purchasePrice = parseFloat(formData.purchasePrice);
      if (!isNaN(depositAmount) && !isNaN(purchasePrice) && purchasePrice > 0) {
        updates.depositPercentage = ((depositAmount / purchasePrice) * 100).toFixed(2);
      }
    } else if (name === 'depositPercentage' && value && formData.purchasePrice) {
      const percentage = parseFloat(value);
      const purchasePrice = parseFloat(formData.purchasePrice);
      if (!isNaN(percentage) && !isNaN(purchasePrice)) {
        updates.deposit = ((purchasePrice * percentage) / 100).toFixed(0);
      }
    } else if (name === 'purchasePrice' && value) {
      const purchasePrice = parseFloat(value);
      if (!isNaN(purchasePrice) && formData.depositPercentage) {
        const percentage = parseFloat(formData.depositPercentage);
        if (!isNaN(percentage)) {
          updates.deposit = ((purchasePrice * percentage) / 100).toFixed(0);
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const convertToMonthly = (amount, frequency) => {
    const freq = FREQUENCIES.find(f => f.value === frequency);
    return amount * (freq?.multiplier || 1);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price is required';
    }
    
    if (!formData.deposit || formData.deposit < 0) {
      newErrors.deposit = 'Deposit is required';
    }
    
    const purchasePrice = parseFloat(formData.purchasePrice);
    const deposit = parseFloat(formData.deposit);
    const depositPercentage = parseFloat(formData.depositPercentage);
    const lmi = parseFloat(formData.lmi) || 0;
    
    if (deposit >= purchasePrice) {
      newErrors.deposit = 'Deposit must be less than purchase price';
    }
    
    if (depositPercentage < 20 && lmi === 0) {
      newErrors.lmi = 'LMI is required when deposit is less than 20%';
    }
    
    if (!formData.interestRate || formData.interestRate <= 0) {
      newErrors.interestRate = 'Interest rate is required';
    }
    
    if (!formData.loanTerm || formData.loanTerm <= 0) {
      newErrors.loanTerm = 'Loan term is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    // Convert all expenses to monthly
    const payload = {
      propertyAddress: formData.propertyAddress,
      purchasePrice: parseFloat(formData.purchasePrice),
      deposit: parseFloat(formData.deposit),
      lmi: parseFloat(formData.lmi) || 0,
      interestRate: parseFloat(formData.interestRate),
      loanTerm: parseInt(formData.loanTerm),
      state: formData.state,
      isFirstHome: formData.isFirstHome,
      weeklyRent: parseFloat(formData.weeklyRent) || 0,
      weeksRented: parseInt(formData.weeksRented) || 52,
      propertyManagementFee: parseFloat(formData.propertyManagementFee) || 0,
      councilRatesMonthly: convertToMonthly(
        parseFloat(formData.councilRates) || 0,
        formData.councilRatesFreq
      ),
      waterRatesMonthly: convertToMonthly(
        parseFloat(formData.waterRates) || 0,
        formData.waterRatesFreq
      ),
      insuranceMonthly: convertToMonthly(
        parseFloat(formData.insurance) || 0,
        formData.insuranceFreq
      ),
      maintenanceMonthly: convertToMonthly(
        parseFloat(formData.maintenance) || 0,
        formData.maintenanceFreq
      ),
      emergencyServicesLevyMonthly: convertToMonthly(
        parseFloat(formData.emergencyServicesLevy) || 0,
        formData.emergencyServicesLevyFreq
      ),
      landTaxMonthly: convertToMonthly(
        parseFloat(formData.landTax) || 0,
        formData.landTaxFreq
      ),
      wealthFeeMonthly: convertToMonthly(
        parseFloat(formData.wealthFee) || 0,
        formData.wealthFeeFreq
      ),
      strataMonthly: convertToMonthly(
        parseFloat(formData.strata) || 0,
        formData.strataFreq
      ),
      capitalGrowthRate: parseFloat(formData.capitalGrowthRate) || 5,
      rentalGrowthRate: parseFloat(formData.rentalGrowthRate) || 3,
    };

    onCalculate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Details */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Property Details</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Property Address
            </label>
            <input
              type="text"
              name="propertyAddress"
              value={formData.propertyAddress}
              onChange={handleChange}
              className="input-field"
              placeholder="123 Main Street, Sydney NSW 2000"
            />
            <p className="text-xs text-gray-500 mt-1">Full address for comparing multiple properties</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Purchase Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className={`input-field pl-8 ${errors.purchasePrice ? 'border-red-500' : ''}`}
                  placeholder="750000"
                />
              </div>
              {errors.purchasePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deposit *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleChange}
                    className={`input-field pl-8 ${errors.deposit ? 'border-red-500' : ''}`}
                    placeholder="150000"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="depositPercentage"
                    value={formData.depositPercentage}
                    onChange={handleChange}
                    className="input-field pr-8"
                    placeholder="20"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
              {errors.deposit && (
                <p className="mt-1 text-sm text-red-600">{errors.deposit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                LMI (Lenders Mortgage Insurance)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="lmi"
                  value={formData.lmi}
                  onChange={handleChange}
                  className={`input-field pl-8 ${errors.lmi ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
              </div>
              {parseFloat(formData.depositPercentage) < 20 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ LMI typically required when deposit is less than 20%</p>
              )}
              {errors.lmi && (
                <p className="mt-1 text-sm text-red-600">{errors.lmi}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                State/Territory *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input-field"
              >
                {AUSTRALIAN_STATES.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFirstHome"
                  checked={formData.isFirstHome}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium">First Home Buyer</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Loan Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Interest Rate (% p.a.) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                className={`input-field pr-8 ${errors.interestRate ? 'border-red-500' : ''}`}
                placeholder="6.5"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
            {errors.interestRate && (
              <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Loan Term (years) *
            </label>
            <input
              type="number"
              name="loanTerm"
              value={formData.loanTerm}
              onChange={handleChange}
              className={`input-field ${errors.loanTerm ? 'border-red-500' : ''}`}
              placeholder="30"
            />
            {errors.loanTerm && (
              <p className="mt-1 text-sm text-red-600">{errors.loanTerm}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rental Income */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Rental Income</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Weekly Rent
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="weeklyRent"
                value={formData.weeklyRent}
                onChange={handleChange}
                className="input-field pl-8"
                placeholder="600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Weeks Rented per Year
            </label>
            <input
              type="number"
              name="weeksRented"
              value={formData.weeksRented}
              onChange={handleChange}
              className="input-field"
              placeholder="52"
              min="0"
              max="52"
            />
            <p className="text-xs text-gray-500 mt-1">Account for vacancy periods (max 52)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Property Management Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                name="propertyManagementFee"
                value={formData.propertyManagementFee}
                onChange={handleChange}
                className="input-field pr-8"
                placeholder="8"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Property Expenses</h2>
        <div className="space-y-4">
          {/* Council Rates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Council Rates
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="councilRates"
                  value={formData.councilRates}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="2000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="councilRatesFreq"
                value={formData.councilRatesFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Water Rates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Water Rates
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="waterRates"
                  value={formData.waterRates}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="800"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="waterRatesFreq"
                value={formData.waterRatesFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Insurance */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Insurance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="1200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="insuranceFreq"
                value={formData.insuranceFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Maintenance */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maintenance & Repairs
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="maintenance"
                  value={formData.maintenance}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="1500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="maintenanceFreq"
                value={formData.maintenanceFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Emergency Services Levy */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Emergency Services Levy
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="emergencyServicesLevy"
                  value={formData.emergencyServicesLevy}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="emergencyServicesLevyFreq"
                value={formData.emergencyServicesLevyFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Land Tax */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Land Tax
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="landTax"
                  value={formData.landTax}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="landTaxFreq"
                value={formData.landTaxFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Strata Fees */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Strata Fees
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="strata"
                  value={formData.strata}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="strataFreq"
                value={formData.strataFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Wealth Management Fee */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Wealth Management Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="wealthFee"
                  value={formData.wealthFee}
                  onChange={handleChange}
                  className="input-field pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <select
                name="wealthFeeFreq"
                value={formData.wealthFeeFreq}
                onChange={handleChange}
                className="input-field"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Assumptions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Growth Assumptions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Capital Growth Rate (% p.a.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                name="capitalGrowthRate"
                value={formData.capitalGrowthRate}
                onChange={handleChange}
                className="input-field pr-8"
                placeholder="5"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rental Growth Rate (% p.a.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                name="rentalGrowthRate"
                value={formData.rentalGrowthRate}
                onChange={handleChange}
                className="input-field pr-8"
                placeholder="3"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="card">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="includeStressTests"
            checked={formData.includeStressTests}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="ml-2 text-sm font-medium">
            Include interest rate stress tests (+0.25%, +0.50%, +1.00%)
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button type="submit" className="btn-primary text-lg px-12 py-3">
          Calculate Returns
        </button>
      </div>
    </form>
  );
}

export default PropertyForm;
