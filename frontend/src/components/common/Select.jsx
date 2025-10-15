const Select = ({
  label,
  error,
  options = [],
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        className={`
          w-full rounded-lg border px-3 py-2
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gtl-red'}
          focus:outline-none focus:ring-2 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
};

export default Select;
