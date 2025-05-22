
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HeroCarousel } from '@/components/home/HeroCarousel';

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                scriptSense
              </h1>
              <p className="text-xl md:text-2xl mb-6">
                Redefining Exam Grading - Where Handwritten Exams Meet Smart Grading!
              </p>
              <p className="text-lg mb-8">
                Our AI-powered solution automates the marking of theory-based handwritten examination scripts with high accuracy and consistency.
              </p>
              <div className="flex space-x-4">
                <Link to="/auth/signin">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
                <Link to="/learn-more">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Now Clickable */}
            <Link to="/learn-more#ocr" className="block transition-transform hover:scale-105">
              <div className="bg-white p-6 rounded-lg shadow-lg h-full">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Advanced OCR</h3>
                <p className="text-gray-600">
                  Extract text from handwritten scripts with high accuracy using state-of-the-art OCR technology.
                </p>
              </div>
            </Link>

            {/* Feature 2 - Now Clickable */}
            <Link to="/learn-more#llm" className="block transition-transform hover:scale-105">
              <div className="bg-white p-6 rounded-lg shadow-lg h-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">AI Evaluation</h3>
                <p className="text-gray-600">
                  Leverage Gemini 2.0 LLM to compare student answers with model answers based on semantic meaning.
                </p>
              </div>
            </Link>

            {/* Feature 3 - Now Clickable */}
            <Link to="/learn-more#analytics" className="block transition-transform hover:scale-105">
              <div className="bg-white p-6 rounded-lg shadow-lg h-full">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Data Analytics</h3>
                <p className="text-gray-600">
                  Visualize grading results, student performance, and examination statistics with intuitive charts.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Scripts</h3>
              <p className="text-gray-600">Upload scanned images of handwritten answer scripts.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">OCR Processing</h3>
              <p className="text-gray-600">Our system extracts text from the images using advanced OCR.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Grading</h3>
              <p className="text-gray-600">The LLM compares extracted text with model answers and assigns grades.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Results & Analytics</h3>
              <p className="text-gray-600">Review grades, adjust if needed, and analyze performance data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">scriptSense</h2>
              <p>© 2025 InsightEd. All rights reserved.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-4">
                <li><a href="#" className="hover:text-blue-300">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-300">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-300">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
