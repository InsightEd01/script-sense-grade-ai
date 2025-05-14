import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-scriptsense-primary mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-900 mb-4">Page not found</p>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back.
        </p>
        <div className="space-y-4">
          {user ? (
            <Link to="/dashboard">
              <Button className="w-full bg-scriptsense-primary">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="w-full bg-scriptsense-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
