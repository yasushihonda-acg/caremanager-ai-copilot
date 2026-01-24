import React from 'react';

type FieldType = 'text' | 'textarea' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

interface MonitoringCompareFieldProps {
  label: string;
  fieldType: FieldType;
  currentValue: string;
  previousValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectOptions?: SelectOption[];
  rows?: number;
  showDiff?: boolean;
}

export const MonitoringCompareField: React.FC<MonitoringCompareFieldProps> = ({
  label,
  fieldType,
  currentValue,
  previousValue,
  onChange,
  placeholder,
  selectOptions = [],
  rows = 3,
  showDiff = true,
}) => {
  const hasPrevious = previousValue !== undefined && previousValue !== '';
  const hasChanged = hasPrevious && currentValue !== previousValue;

  const handleCopyPrevious = () => {
    if (previousValue) {
      onChange(previousValue);
    }
  };

  const getDisplayValue = (value: string): string => {
    if (fieldType === 'select' && selectOptions.length > 0) {
      const option = selectOptions.find((o) => o.value === value);
      return option?.label || value;
    }
    return value;
  };

  const renderInput = () => {
    const baseClassName =
      'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    const highlightClassName = hasChanged
      ? 'border-amber-400 bg-amber-50'
      : 'border-gray-300';

    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${baseClassName} ${highlightClassName} resize-none`}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClassName} ${highlightClassName}`}
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${baseClassName} ${highlightClassName}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {hasChanged && showDiff && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            ⚡ 変更あり
          </span>
        )}
      </div>

      {renderInput()}

      {/* 前回値の表示 */}
      {hasPrevious && showDiff && (
        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-shrink-0 text-gray-500 text-xs mt-0.5">📋 前回:</span>
          <p className="flex-1 text-sm text-gray-600 whitespace-pre-wrap break-words">
            {getDisplayValue(previousValue!)}
          </p>
          <button
            type="button"
            onClick={handleCopyPrevious}
            className="flex-shrink-0 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            コピー
          </button>
        </div>
      )}
    </div>
  );
};

export default MonitoringCompareField;
