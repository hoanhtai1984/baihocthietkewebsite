import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Layout() {
  return (
    <div className="site-bg-wrap">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <div id="toast-container"></div>
    </div>
  );
}

export default Layout;
