import { Loader2 } from 'lucide-react';

const Loading = ({ text = 'Cargando...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gtl-red animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">{text}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-gtl-red animate-spin mx-auto" />
        <p className="mt-2 text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
};

export default Loading;
