
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, FileImage, BarChart, Users } from 'lucide-react';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-scriptsense-primary text-white p-2 rounded">
                <FileText size={24} />
              </div>
              <span className="text-2xl font-bold text-scriptsense-primary">scriptSense</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/signin">
                <Button variant="outline" className="font-medium">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-scriptsense-primary hover:bg-blue-700 text-white font-medium">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Automate Exam Grading</span>
            <span className="block text-scriptsense-primary">with AI Precision</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            scriptSense uses advanced AI to automatically grade handwritten exam answers,
            saving valuable time for educators while ensuring consistent and fair evaluations.
          </p>
          <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
            <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
              <Link to="/signup">
                <Button className="flex items-center justify-center w-full bg-scriptsense-primary hover:bg-blue-700 text-white px-8 py-6 text-base font-medium">
                  Get Started
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" className="flex items-center justify-center w-full px-8 py-6 text-base font-medium">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Reimagine Exam Grading
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              From handwritten to graded in minutes, not days.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <FileImage size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">OCR Extraction</h3>
              <p className="mt-2 text-gray-600">
                Advanced optical character recognition technology accurately extracts text from handwritten exam scripts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Grading</h3>
              <p className="mt-2 text-gray-600">
                State-of-the-art LLM technology evaluates answers based on semantic understanding of model answers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <BarChart size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Detailed Analytics</h3>
              <p className="mt-2 text-gray-600">
                Comprehensive dashboards and visualizations help identify trends and areas for improvement.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Student Management</h3>
              <p className="mt-2 text-gray-600">
                Organize students, subjects, and exams with an intuitive interface designed for educators.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Model Answer Generation</h3>
              <p className="mt-2 text-gray-600">
                Generate comprehensive model answers with AI or create your own for precise grading.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 text-scriptsense-primary">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Human-in-the-Loop</h3>
              <p className="mt-2 text-gray-600">
                Review and adjust AI-assigned scores with detailed explanations and justifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-scriptsense-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your grading workflow?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Join educators who are saving hours every week with scriptSense.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/signup">
              <Button className="bg-white text-scriptsense-primary hover:bg-gray-100 px-8 py-3 text-base font-medium">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center space-x-2">
              <div className="bg-white text-scriptsense-primary p-2 rounded">
                <FileText size={20} />
              </div>
              <span className="text-xl font-bold text-white">scriptSense</span>
            </div>
            <div className="mt-4 text-center text-sm text-gray-400 md:mt-0">
              &copy; {new Date().getFullYear()} InsightEd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
