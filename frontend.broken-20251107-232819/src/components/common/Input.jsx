import { AlertCircle } from 'lucide-react';

const Input = ({
  label,
  error,
  type = 'text',
  required = false,
  icon: Icon,
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
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          type={type}
          className={`
            w-full rounded-lg border px-3 py-2
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gtl-red'}
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
