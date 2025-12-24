import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  name: string;
  icon: string;
  path: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  menuItems: MenuItem[];
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, menuItems }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between h-24 px-6 border-b border-gray-800">
        <div className="flex flex-col">
          <h1 className="text-md font-bold">EHS Raw Material Classification</h1>
          <p className="text-sm text-gray-400">DG & GHS System</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => {
              setSidebarOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center px-6 py-3 transition-colors ${
              location.pathname === item.path
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

