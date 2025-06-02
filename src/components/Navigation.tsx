import Link from 'next/link'
import { supabase } from '../lib/supabase'

const Navigation = () => {
  const user = true // Replace with actual user authentication logic

  return (
    <nav className="flex space-x-4">
      <Link href="/" className="text-gray-300 hover:text-white">
        Map
      </Link>
      <Link href="/wall" className="text-gray-300 hover:text-white">
        Wall
      </Link>
      {user ? (
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-gray-300 hover:text-white"
        >
          Logout
        </button>
      ) : (
        <Link href="/auth" className="text-gray-300 hover:text-white">
          Login
        </Link>
      )}
    </nav>
  )
}

export default Navigation 