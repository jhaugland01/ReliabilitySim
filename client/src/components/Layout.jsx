import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-semibold text-gray-900">
                Reliability Sim
              </Link>
              <nav className="flex gap-6">
                <Link 
                  to="/" 
                  className={`text-sm font-medium ${
                    location.pathname === '/' 
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Scenarios
                </Link>
                <Link 
                  to="/compare" 
                  className={`text-sm font-medium ${
                    location.pathname === '/compare' 
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Compare
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
