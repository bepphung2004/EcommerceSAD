import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function MainLayout({ cartCount, onLogout, searchKeyword, setSearchKeyword, userRole }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header 
        cartCount={cartCount} 
        onLogout={onLogout} 
        searchKeyword={searchKeyword} 
        setSearchKeyword={setSearchKeyword} 
        userRole={userRole}
      />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <Footer userRole={userRole} />
    </div>
  );
}

export default MainLayout;
