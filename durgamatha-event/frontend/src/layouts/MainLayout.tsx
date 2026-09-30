import { Outlet } from 'react-router'
import Navbar from '../components/Navbar'

const currentYear = new Date().getFullYear()

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800">
      <Navbar />

      {/* <Outlet /> is where the current page (Home, Events, Login...) is shown */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
        © {currentYear} Durgamatha Events
      </footer>
    </div>
  )
}

export default MainLayout
