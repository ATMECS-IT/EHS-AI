import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../pages/Sidebar/Sidebar';
import Header from '../../pages/Header/Header';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Raw Materials', icon: '🧪', path: '/raw-materials' },
    { name: 'Analytics', icon: '📈', path: '/analytics' },
    // { name: 'Users', icon: '👥', path: '/users' },
    // { name: 'Products', icon: '📦', path: '/products' },
    // { name: 'Orders', icon: '🛒', path: '/orders' },
    // { name: 'Settings', icon: '⚙️', path: '/settings' },
  ];

  // Route to page title mapping
  const getPageTitle = () => {
    const routeMap: Record<string, { title: string; subtitle?: string }> = {
      '/dashboard': {
        title: 'Dashboard',
        subtitle: 'Overview of GHS and DG compliance classifications, analytics, and insights.',
      },
      '/raw-materials': {
        title: 'Raw Materials',
        subtitle: 'Manage and view raw materials SDS records.',
      },
      '/analytics': {
        title: 'Analytics',
        subtitle: 'Detailed analytics and insights for GHS and DG compliance classifications.',
      },
    };
    return routeMap[location.pathname] || { title: 'Dashboard' };
  };

  const pageInfo = getPageTitle();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        menuItems={menuItems}
      />

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header setSidebarOpen={setSidebarOpen} pageInfo={pageInfo} />

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

