'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  ListChecks,
  FileText,
  Sparkles,
  FileCheck,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export default function LandingPage() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-black font-sans overflow-x-hidden">

      {/* Background Decor Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
      <motion.div
        style={{ y: backgroundY }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4"
      />
      <motion.div
        style={{ y: backgroundY }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/4 translate-y-1/4"
      />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <FileText className="w-6 h-6 text-slate-900" />
            </motion.div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              ExamGen
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            {['Features', 'How It Works', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="relative hover:text-white transition-colors group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2 h-11 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-sm font-medium text-amber-200">v2.0 Now Available</span>
          </motion.div>

          <motion.div style={{ y: textY }}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tight leading-tight mb-8 drop-shadow-2xl"
            >
              Craft Perfect <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-serif italic pr-2">
                Exam Papers
              </span>
              <span className="relative inline-block ml-2">
                <span className="relative z-10 text-amber-400">in Minutes</span>
                <motion.svg
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1 }}
                  className="absolute -bottom-2 left-0 h-3 text-amber-600/40 opacity-80"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </motion.svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Stop wrestling with formatting. Upload your curriculum, set your blueprint,
              and let our AI generate university-compliant, balanced question papers instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-slate-900 text-lg font-bold px-8 rounded-xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all border-none">
                  <FileText className="w-5 h-5 mr-2" />
                  Start Creating Free
                </Button>
              </Link>

              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl backdrop-blur-sm px-8">
                <PlayCircle className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Elements Background */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [-12, -10, -12]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-12 hidden lg:block opacity-40 pointer-events-none"
          >
            <div className="w-48 h-64 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl p-4">
              <div className="h-4 w-1/2 bg-slate-700 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-700/50 rounded" />
                <div className="h-2 w-full bg-slate-700/50 rounded" />
                <div className="h-2 w-3/4 bg-slate-700/50 rounded" />
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [12, 14, 12]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-1/3 right-0 -translate-y-1/2 translate-x-12 hidden lg:block opacity-40 pointer-events-none"
          >
            <div className="w-40 h-56 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl p-4 flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-amber-400" />
              </div>
              <div className="h-2 w-20 bg-slate-700 rounded" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Wave Separator */}
      <div className="relative w-full overflow-hidden leading-none z-20">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[120px] text-white"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="currentColor"
            className="fill-slate-950"
          ></path>
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V56.44Z"
            fill="currentColor"
            className="fill-white"
          ></path>
        </svg>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white text-slate-900 py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
              Why leading institutions choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">ExamGen</span>
            </h2>
            <p className="text-lg text-slate-600">
              Streamline your examination process with tools designed specifically for academic rigor and formatting compliance.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Upload,
                title: "Smart Import",
                desc: "Drag & drop your existing question banks. We parse Excel, CSV, and Word documents instantly.",
                color: "bg-blue-500/10 text-blue-600"
              },
              {
                icon: ClipboardList,
                title: "Blueprint Builder",
                desc: "Design complex exam structures. Define marks, sections, and difficulty distribution visually.",
                color: "bg-amber-500/10 text-amber-600"
              },
              {
                icon: Sparkles,
                title: "One-Click Gen",
                desc: "Our AI balances questions according to bloom's taxonomy and topic coverage automatically.",
                color: "bg-purple-500/10 text-purple-600"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-40 h-40" />
                </div>
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-base">
                  {feature.desc}
                </p>
                <motion.div
                  className="mt-6 flex items-center text-amber-600 font-semibold text-sm cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Learn more <ArrowRight className="w-4 h-4 ml-1" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Trust Bar */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">Trusted by modern educators at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {['MIT', 'Stanford', 'Oxford', 'Cambridge'].map((brand) => (
              <span key={brand} className="text-2xl font-bold font-serif text-slate-600 italic">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: 'Papers Generated', value: '50k+', icon: FileCheck },
              { label: 'Hours Saved', value: '120k+', icon: Clock },
              { label: 'Institutions', value: '800+', icon: Shield },
              { label: 'Uptime', value: '99.9%', icon: Zap },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-950 to-slate-900 relative overflow-hidden border-t border-slate-800">
        <motion.div
          style={{ y: backgroundY }}
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"
        />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
              Ready to revolutionize your <br />
              <span className="text-amber-400 font-serif italic">examination workflow?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Join 500+ departments saving over 20 hours per exam cycle.
              No credit card required for trial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-16 px-10 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xl font-bold rounded-2xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-1 transition-all">
                  Get Started Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 border-slate-700 text-white hover:bg-white/5 rounded-2xl">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">ExamGen</span>
              </div>
              <p className="max-w-xs text-slate-500 leading-relaxed">
                The world's most advanced AI-powered platform for automated exam paper generation and management.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
              <div>
                <h4 className="text-white font-semibold mb-6">Product</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Templates</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-6">Company</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Blog</a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="text-white font-semibold mb-6">Legal</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Cookies</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="mb-4 md:mb-0 opacity-60">
              &copy; 2026 ExamGen Inc. All rights reserved.
            </div>
            <div className="flex space-x-6">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <a key={social} href="#" className="hover:text-white transition-colors capitalize">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
