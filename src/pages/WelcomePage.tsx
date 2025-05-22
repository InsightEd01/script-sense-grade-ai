import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pen, CheckCircle, FileImage, BarChart, Users, ArrowRight, Star, School, Code } from 'lucide-react';
import { HeroCarousel } from '@/components/home/HeroCarousel';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-stylus-primary text-white p-2 rounded">
                <Pen size={24} />
              </div>
              <span className="text-2xl font-bold text-stylus-primary">
                <span style={{ fontFamily: 'cursive, calligraphic, serif', fontWeight: 700, fontSize: '1.5em' }}>Stylus</span>
                <span className="ml-2 text-base font-normal text-gray-500">(Formally scriptSense ai)</span>
              </span>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className="flex items-center space-x-4">
                <Link to="/signin">
                  <Button className="bg-stylus-primary hover:bg-blue-700 text-white font-medium">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="font-medium">Create Admin Account</Button>
                </Link>
              </div>
              <span className="text-xs text-gray-400">by InsightEd</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                Redefining Grading
                <span className="block text-stylus-primary mt-2">Handwritten Exams Meet Smart Grading!</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Stylus (Formally scriptSense ai) is a revolutionary AI-powered platform designed to transform how educators grade and evaluate student work, making assessment smarter and more efficient.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signin">
                  <Button className="w-full sm:w-auto bg-stylus-primary hover:bg-blue-700 text-white px-8 py-6 text-lg">
                    Sign In
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg">
                    Create Admin Account
                  </Button>
                </Link>
              </div>
            </div>
            {/* Show carousel on both mobile and desktop */}
            <div className="lg:block mt-8 lg:mt-0">
              <HeroCarousel />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-stylus-primary">60+</div>
              <div className="text-gray-600 mt-2">Teachers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-stylus-primary">2.5k+</div>
              <div className="text-gray-600 mt-2">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-stylus-primary">95%</div>
              <div className="text-gray-600 mt-2">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Transform Your Grading Process
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform streamlines assessment workflows and ensures consistent evaluation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileImage,
                title: "Smart OCR Technology",
                description: "Advanced text extraction from handwritten scripts with high accuracy"
              },
              {
                icon: Code,
                title: "AI-Powered Analysis",
                description: "Intelligent evaluation using state-of-the-art language models"
              },
              {
                icon: CheckCircle,
                title: "Instant Feedback",
                description: "Quick and consistent grading with detailed explanations"
              },
              {
                icon: Users,
                title: "Student Management",
                description: "Efficient organization of student data and performance tracking"
              },
              {
                icon: BarChart,
                title: "Analytics Dashboard",
                description: "Comprehensive insights into student and class performance"
              },
              {
                icon: Star,
                title: "Quality Assurance",
                description: "Maintain grading consistency across all assessments"
              }
            ].map((feature, index) => (
              <div key={index} className="group p-6 rounded-xl border bg-white hover:shadow-lg transition-all">
                <div className="flex flex-col items-start">
                  <div className="p-3 rounded-lg bg-blue-50 text-stylus-primary mb-4">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-stylus-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Assessment Process?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join educators who are saving hours every week with Stylus's intelligent grading system.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-stylus-primary hover:bg-gray-100">
              Get Started Now
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-white p-2 rounded">
                  <Pen size={20} className="text-stylus-primary" />
                </div>
                <span className="text-xl font-bold text-white">
                  <span style={{ fontFamily: 'cursive, calligraphic, serif', fontWeight: 700, fontSize: '1.2em' }}>Stylus</span>
                  <span className="ml-2 text-xs font-normal text-gray-300">(Formally scriptSense ai)</span>
                </span>
              </div>
              <p className="text-gray-400">
                Transforming education assessment with AI-powered solutions.
              </p>
              <span className="text-xs text-gray-400 block mt-2">by InsightEd</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Use Cases</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Support</li>
                <li>Blog</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            &copy; {new Date().getFullYear()} InsightEd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
