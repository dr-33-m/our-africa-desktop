import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, User, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
// import ThemeToggle from "../ui/ThemeToggle";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface dark:bg-surface-dark shadow-sm border-b border-border dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate({ to: "/" })}
            >
              <BookOpen className="h-8 w-8 text-primary dark:text-primary-dark" />
              <span className="ml-2 text-xl font-bold text-text dark:text-text-dark">
                Our Africa
              </span>
            </div>

            {user && (
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({ to: "/" });
                  }}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-text dark:text-text-dark border-b-2 border-transparent hover:border-primary-dark"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({ to: "/modules/browse" });
                  }}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-text-secondary dark:text-text-secondary-dark border-b-2 border-transparent hover:border-primary-dark"
                >
                  Browse Modules
                </a>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* <ThemeToggle /> */}

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary-dark/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary dark:text-primary-dark" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark hidden md:inline-block">
                    {user.username}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate({ to: "/auth/login" });
                  }}
                  leftIcon={<LogOut size={16} />}
                >
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/auth/login" })}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate({ to: "/auth/register" })}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
