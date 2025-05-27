import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth.tsx";
import { useLocation } from "wouter";
import { Bot } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="bg-phil-purple text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-phil-pink rounded-full flex items-center justify-center">
                <Bot className="text-white h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold">PHIL</h1>
              <span className="text-phil-light-purple text-sm hidden sm:block">
                AI Agent Builder
              </span>
            </button>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => setLocation("/")}
              className={`hover:text-phil-light-purple transition-colors ${
                location === "/" ? "text-phil-light-purple" : ""
              }`}
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => setLocation("/dashboard")}
                className={`hover:text-phil-light-purple transition-colors ${
                  location === "/dashboard" ? "text-phil-light-purple" : ""
                }`}
              >
                Dashboard
              </button>
            )}
            <button className="hover:text-phil-light-purple transition-colors">
              Docs
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm hidden sm:block">
                  Welcome, {user.email}
                </span>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-phil-purple"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  className="bg-phil-pink hover:bg-pink-600"
                  onClick={() => setLocation("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-phil-purple"
                  onClick={() => setLocation("/register")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
