// components/landing/LandingPage.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const cardRef = useRef(null);
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all elements with animation class
    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 -skew-y-6 transform origin-top-left"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                  <span className="text-white font-bold text-3xl">C</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse-gentle"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Transform Your School's{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Administration
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              CAP_mis - The complete solution for student ID cards, attendance tracking, and permission management in one seamless platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{animationDelay: '0.4s'}}>
              <Link
                to="/login"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <button className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl border-2 border-emerald-200 hover:border-emerald-300 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                Watch Demo Video
              </button>
            </div>
            
            {/* Animated Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-on-scroll">
              <StatCard number="500+" label="Cards Generated Daily" delay="0.1s" />
              <StatCard number="98%" label="Parent Satisfaction" delay="0.2s" />
              <StatCard number="70%" label="Time Saved" delay="0.3s" />
              <StatCard number="24/7" label="Support Available" delay="0.4s" />
            </div>
          </div>
        </div>
        
        {/* Floating Animated Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-emerald-300 rounded-full opacity-60 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-green-400 rounded-full opacity-40 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-8 h-8 bg-emerald-200 rounded-full opacity-30 animate-float" style={{animationDelay: '3s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything Schools Need in{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                One Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From digital ID cards to instant parent notifications, we've built every tool schools need for modern administration.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon="👨‍🎓"
              title="Student Management"
              description="Complete digital records with photos, parent contacts, and class organization."
              delay="0.1s"
              bgColor="from-emerald-50 to-green-50"
            />
            <FeatureCard 
              icon="🪪"
              title="ID Card Generation"
              description="Professional ID cards with custom templates, batch processing, and instant printing."
              delay="0.2s"
              bgColor="from-blue-50 to-cyan-50"
            />
            <FeatureCard 
              icon="📝"
              title="Permission Slips"
              description="Digital permission slips with automatic parent notifications and approval workflow."
              delay="0.3s"
              bgColor="from-purple-50 to-pink-50"
            />
            <FeatureCard 
              icon="📱"
              title="SMS Integration"
              description="Instant SMS notifications to parents via TextBee API integration."
              delay="0.4s"
              bgColor="from-amber-50 to-orange-50"
            />
            <FeatureCard 
              icon="📊"
              title="Analytics Dashboard"
              description="Real-time insights, reports, and performance metrics for better decision making."
              delay="0.5s"
              bgColor="from-indigo-50 to-purple-50"
            />
            <FeatureCard 
              icon="🔄"
              title="Bulk Operations"
              description="Import/export hundreds of students, generate cards in batches, and automate workflows."
              delay="0.6s"
              bgColor="from-red-50 to-rose-50"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How <span className="text-emerald-600">CAP_mis</span> Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four simple steps to transform your school's administrative workflow
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-emerald-400 to-green-500 opacity-30"></div>
            
            <div className="space-y-12 md:space-y-0">
              <TimelineStep 
                number="1"
                title="Add Students"
                description="Import your student database via CSV or add individually with photos and parent contacts."
                icon="📥"
                side="left"
                delay="0.1s"
              />
              <TimelineStep 
                number="2"
                title="Generate ID Cards"
                description="Design custom templates and generate professional ID cards for all students instantly."
                icon="🖨️"
                side="right"
                delay="0.2s"
              />
              <TimelineStep 
                number="3"
                title="Manage Permissions"
                description="Create digital permission slips, get instant parent approval via SMS, and track student movement."
                icon="✅"
                side="left"
                delay="0.3s"
              />
              <TimelineStep 
                number="4"
                title="Analyze & Optimize"
                description="Use real-time dashboards and reports to improve school operations and parent communication."
                icon="📈"
                side="right"
                delay="0.4s"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-on-scroll">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto animate-on-scroll" style={{animationDelay: '0.2s'}}>
            Join hundreds of schools already using CAP_mis to streamline administration and enhance parent communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-on-scroll" style={{animationDelay: '0.4s'}}>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Start Free Trial
            </Link>
            <Link
              to="/documentation"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
            >
              View Documentation
            </Link>
          </div>
          <p className="mt-6 text-emerald-200 animate-on-scroll" style={{animationDelay: '0.6s'}}>
            No credit card required • 14-day free trial • Full support included
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="animate-on-scroll">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">CAP_mis</h3>
                  <p className="text-sm text-gray-400">Smart School Administration</p>
                </div>
              </div>
              <p className="text-gray-400">
                Transforming school administration with modern technology solutions.
              </p>
            </div>
            
            <div className="animate-on-scroll" style={{animationDelay: '0.1s'}}>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div className="animate-on-scroll" style={{animationDelay: '0.2s'}}>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div className="animate-on-scroll" style={{animationDelay: '0.3s'}}>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
                <li><a href="mailto:dusenge.enzo87@gmail.com" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="tel:+250793166542" className="text-gray-400 hover:text-white transition-colors">+250 793 166 542</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm animate-on-scroll" style={{animationDelay: '0.4s'}}>
            <p>&copy; {new Date().getFullYear()} CAP_mis. All rights reserved. Made with ❤️ for schools worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components
const StatCard = ({ number, label, delay }) => (
  <div 
    className="text-center animate-on-scroll" 
    style={{animationDelay: delay}}
  >
    <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2 animate-count">
      {number}
    </div>
    <div className="text-gray-600">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, description, delay, bgColor }) => (
  <div 
    className={`p-6 rounded-2xl bg-gradient-to-br ${bgColor} border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-on-scroll`}
    style={{animationDelay: delay}}
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const TimelineStep = ({ number, title, description, icon, side, delay }) => (
  <div 
    className={`relative flex items-center ${side === 'left' ? 'md:justify-end pr-8 md:pr-12' : 'md:justify-start pl-8 md:pl-12'} animate-on-scroll`}
    style={{animationDelay: delay}}
  >
    <div className={`hidden md:block absolute top-1/2 transform -translate-y-1/2 ${side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}`}>
      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center border-4 border-white">
        <span className="text-white text-sm font-bold">{number}</span>
      </div>
    </div>
    
    <div className={`bg-white rounded-2xl p-6 shadow-xl border border-gray-200 max-w-md ${side === 'left' ? 'md:text-right' : 'md:text-left'}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default LandingPage;