
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, FileImage, BarChart, Users, ArrowRight, Star, School, Code } from 'lucide-react';
import { HeroCarousel } from '@/components/home/HeroCarousel';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-scriptsense-primary text-white p-2 rounded">
                <School size={24} />
              </div>
              <span className="text-2xl font-bold text-scriptsense-primary">scriptSense</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/signin">
                <Button variant="outline" className="font-medium">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-scriptsense-primary hover:bg-blue-700 text-white font-medium">Get Started</Button>
              </Link>
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
                Let's Create a Brilliant
                <span className="block text-scriptsense-primary mt-2">Future in Education</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                scriptSense is a revolutionary AI-powered platform designed to transform how educators grade and evaluate student work, making assessment smarter and more efficient.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button className="w-full sm:w-auto bg-scriptsense-primary hover:bg-blue-700 text-white px-8 py-6 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg">
                    Learn More
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
              <div className="text-3xl font-bold text-scriptsense-primary">60+</div>
              <div className="text-gray-600 mt-2">Teachers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-scriptsense-primary">2.5k+</div>
              <div className="text-gray-600 mt-2">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-scriptsense-primary">95%</div>
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
                  <div className="p-3 rounded-lg bg-blue-50 text-scriptsense-primary mb-4">
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
      <section className="py-20 px-4 bg-scriptsense-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Assessment Process?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join educators who are saving hours every week with scriptSense's intelligent grading system.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-scriptsense-primary hover:bg-gray-100">
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
                  <School size={20} className="text-scriptsense-primary" />
                </div>
                <span className="text-xl font-bold text-white">scriptSense</span>
              </div>
              <p className="text-gray-400">
                Transforming education assessment with AI-powered solutions.
              </p>
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
