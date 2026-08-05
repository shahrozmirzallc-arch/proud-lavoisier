// src/components/common/BusinessDropdown.jsx
// Authoritative IDS Pulse Business Dropdown with "Other / Not listed" support

import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

/**
 * BusinessDropdown Component
 * Enforces Global Dropdown Rule — "Other / Not listed" Support
 */
export default function BusinessDropdown({
  label,
  options = [], // [{ id/value, name/label }] or string array
  value = '',
  onChange, // (newValue, isOther) => void
  placeholder = 'Select an option',
  customInputLabel,
  customInputPlaceholder = 'Type custom value...',
  required = false,
  error = '',
  className = '',
  selectClassName = '',
  inputClassName = '',
  id,
  name,
  disabled = false
}) {
  // Normalize options into [{ value, label }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.name,
        label: opt.label ?? opt.name ?? opt.value ?? opt.id
      };
    }
    return { value: String(opt), label: String(opt) };
  });

  const OTHER_VALUE = 'Other / Not listed';

  // Determine if value is a known standard option (empty string is not standard)
  const isStandardValue = (val) => {
    if (val === '' || val === null || val === undefined) return false;
    return normalizedOptions.some(o => o.value === val);
  };

  const [selectedOption, setSelectedOption] = useState(() => {
    if (!value) return '';
    if (isStandardValue(value)) return value;
    return OTHER_VALUE;
  });

  const [customText, setCustomText] = useState(() => {
    if (value && !isStandardValue(value)) return value;
    return '';
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingOption, setPendingOption] = useState('');
  const [validationError, setValidationError] = useState('');

  // Synchronize internal state with external value changes
  useEffect(() => {
    if (selectedOption === OTHER_VALUE) {
      if (value && isStandardValue(value)) {
        setSelectedOption(value);
        setCustomText('');
        setValidationError('');
      } else {
        if (value && value !== customText) {
          setCustomText(value);
        }
      }
      return;
    }

    if (!value) {
      setSelectedOption('');
      setCustomText('');
      setValidationError('');
    } else if (isStandardValue(value)) {
      setSelectedOption(value);
      setCustomText('');
      setValidationError('');
    } else {
      setSelectedOption(OTHER_VALUE);
      setCustomText(value);
    }
  }, [value, options]);

  // Handle select dropdown change
  const handleSelectChange = (e) => {
    const nextVal = e.target.value;

    // If switching from "Other" (with non-empty custom text) to a standard option -> request confirmation
    if (selectedOption === OTHER_VALUE && customText.trim() !== '' && nextVal !== OTHER_VALUE) {
      setPendingOption(nextVal);
      setShowConfirmModal(true);
      return;
    }

    applySelectChange(nextVal);
  };

  const applySelectChange = (nextVal) => {
    setSelectedOption(nextVal);
    setValidationError('');

    if (nextVal === OTHER_VALUE) {
      // Trigger onChange with custom text (or empty string if not entered yet)
      const trimmedCustom = customText.trim();
      onChange(trimmedCustom, true);
    } else {
      setCustomText('');
      onChange(nextVal, false);
    }
  };

  const confirmSwitchToStandard = () => {
    setShowConfirmModal(false);
    applySelectChange(pendingOption);
    setPendingOption('');
  };

  const cancelSwitchToStandard = () => {
    setShowConfirmModal(false);
    setPendingOption('');
  };

  // Handle custom input change
  const handleCustomTextChange = (e) => {
    const rawVal = e.target.value;
    setCustomText(rawVal);

    if (rawVal.trim() === '') {
      setValidationError('Please specify the custom value.');
    } else {
      setValidationError('');
    }

    onChange(rawVal, true);
  };

  const effectiveCustomInputLabel = customInputLabel || (label ? `Enter the missing ${label.toLowerCase()}` : 'Enter custom value');

  return (
    <div className={`flex flex-col gap-1.5 text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Primary Dropdown Control */}
      <div className="relative w-full">
        <select
          id={id}
          name={name}
          value={selectedOption}
          onChange={handleSelectChange}
          disabled={disabled}
          className={`min-h-[44px] w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            error || validationError ? 'border-rose-400 bg-rose-50/20' : ''
          } ${selectClassName}`}
        >
          <option value="">{placeholder}</option>
          {normalizedOptions.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other / Not listed</option>
        </select>
      </div>

      {/* Conditional Custom Text Input when "Other / Not listed" is selected */}
      {selectedOption === OTHER_VALUE && (
        <div className="flex flex-col gap-1 mt-1 p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-left animate-in fade-in duration-150">
          <label className="text-[10.5px] font-extrabold text-blue-950 uppercase tracking-wider block">
            {effectiveCustomInputLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={customText}
            onChange={handleCustomTextChange}
            placeholder={customInputPlaceholder}
            disabled={disabled}
            className={`min-h-[44px] w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              validationError ? 'border-rose-400 focus:ring-rose-400' : 'border-blue-300'
            } ${inputClassName}`}
          />
          <span className="text-[10px] text-blue-800 font-medium">
            This custom text will be saved as the authoritative value.
          </span>
        </div>
      )}

      {/* Validation / Error Messages */}
      {(error || validationError) && (
        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || validationError}</span>
        </div>
      )}

      {/* Confirmation Modal when switching away from Other */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded-2xl p-4 shadow-2xl max-w-xs w-full text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <HelpCircle className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Clear Custom Value?</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Switching to a standard option will clear your entered custom value (
              <span className="font-bold text-slate-900">"{customText}"</span>). Continue?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelSwitchToStandard}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Keep Custom Text
              </button>
              <button
                type="button"
                onClick={confirmSwitchToStandard}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg transition-colors shadow-xs"
              >
                Clear & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
