import { Menu, LogOut, User } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gtl-red rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">GTL</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gtl-gray">
                  GTL CONSULTING SACS
                </h1>
                <p className="text-xs text-gray-500">Sistema Financiero</p>
              </div>
            </div>
          </div>
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Administrador</span>
            </div>
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
