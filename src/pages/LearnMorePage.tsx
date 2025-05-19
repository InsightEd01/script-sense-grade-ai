import { motion } from 'framer-motion';
import { ChevronRight, Pen, BookOpen, Brain, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LearnMorePage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: <Brain className="w-12 h-12 text-stylus-primary" />,
      title: "AI-Powered Grading",
      description: "Revolutionary AI technology that helps teachers grade answer scripts with accuracy and consistency."
    },
    {
      icon: <BookOpen className="w-12 h-12 text-stylus-primary" />,
      title: "Smart Learning Analytics",
      description: "Detailed insights into student performance patterns and learning progress."
    },
    {
      icon: <Users className="w-12 h-12 text-stylus-primary" />,
      title: "Collaborative Assessment",
      description: "Work together with other teachers to ensure fair and standardized grading across classes."
    },
    {
      icon: <Award className="w-12 h-12 text-stylus-primary" />,
      title: "Personalized Feedback",
      description: "Generate detailed, constructive feedback for each student automatically."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-stylus-primary text-white p-2 rounded">
              <Pen size={20} />
            </div>
            <span className="text-xl font-bold text-stylus-primary">
              <span style={{ fontFamily: 'cursive, calligraphic, serif', fontWeight: 700, fontSize: '1.3em' }}>Stylus</span>
              <span className="ml-2 text-base font-normal text-gray-500">(Formally scriptSense ai)</span>
            </span>
          </Link>
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
            <span className="text-xs text-gray-400">by InsightEd</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <motion.div 
          className="container mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your 
            <span className="text-stylus-primary" style={{ fontFamily: 'cursive, calligraphic, serif', fontWeight: 700 }}>Stylus</span>
            <span className="ml-2 text-base font-normal text-gray-500">(Formally scriptSense ai)</span>
            <span className="block text-xs text-gray-400 mt-1">by InsightEd</span>
            Grading Experience
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover how Stylus (Formally scriptSense ai) revolutionizes the way teachers assess student work, 
            making grading more efficient, consistent, and insightful than ever before.
          </p>
          <div className="flex justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-stylus-primary hover:bg-stylus-primary/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600">Everything you need to streamline your assessment process</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="video-demo" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50" style={{ scrollMarginTop: '4rem' }}>
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">See Stylus (Formally scriptSense ai) in Action</h2>
            <p className="text-lg text-gray-600 mb-8">Watch how our AI-powered grading system transforms the assessment process</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
          >
            <iframe
              src="https://drive.google.com/file/d/1rs2saYbpYe7uwwIhS2b7aFMkTfG2md25/preview"
              allow="autoplay"
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple steps to transform your grading process</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative h-full">
                <CardHeader>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-stylus-primary text-white rounded-full flex items-center justify-center text-xl font-bold">1</div>
                  <CardTitle className="pt-6">Upload Scripts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Simply upload student answer scripts in any format - handwritten, typed, or scanned documents.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="relative h-full">
                <CardHeader>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-stylus-primary text-white rounded-full flex items-center justify-center text-xl font-bold">2</div>
                  <CardTitle className="pt-6">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our AI engine analyzes the content, comparing responses with model answers and grading criteria.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="relative h-full">
                <CardHeader>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-stylus-primary text-white rounded-full flex items-center justify-center text-xl font-bold">3</div>
                  <CardTitle className="pt-6">Get Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receive detailed grades, feedback, and analytics that you can review and adjust as needed.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-stylus-primary text-white">
        <motion.div 
          className="container mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-3xl mx-auto">
            <Sparkles className="w-16 h-16 mx-auto mb-8" />
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Grading?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of educators who are already saving time and providing better feedback with Stylus (Formally scriptSense ai).
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-stylus-primary hover:bg-white/90">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded">
                <Pen size={20} className="text-stylus-primary" />
              </div>
              <span className="text-xl font-bold">
                <span style={{ fontFamily: 'cursive, calligraphic, serif', fontWeight: 700 }}>Stylus</span>
                <span className="ml-2 text-xs font-normal text-gray-300">(Formally scriptSense ai)</span>
              </span>
            </div>
            <div className="text-gray-400">
              © {new Date().getFullYear()} Stylus (Formally scriptSense ai) by InsightEd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMorePage;
