import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Calendar,
  DollarSign,
  MessageSquareWarning,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      description:
        "Efficiently manage student registrations, room allocations, and personal information all in one place.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Building2,
      title: "Hall Administration",
      description:
        "Streamline hall operations with digital records, room availability tracking, and automated notifications.",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: DollarSign,
      title: "Payment Tracking",
      description:
        "Monitor financial transactions, dues, payments, and generate detailed reports with ease.",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      icon: Wrench,
      title: "Maintenance Requests",
      description:
        "Submit and track maintenance issues efficiently with real-time status updates and priority management.",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      icon: MessageSquareWarning,
      title: "Complaint Management",
      description:
        "File and resolve complaints with proper tracking, escalation, and resolution documentation.",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description:
        "Plan, coordinate, and manage hall events with registration, announcements, and attendance tracking.",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Navbar Component */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6">
            🎓 Welcome to RUET Hall Management System
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Simplify Your
            <span className="text-primary"> Hall Life</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Rajshahi University of Engineering & Technology - A comprehensive
            digital solution for managing residential halls, student
            allocations, and administrative tasks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8 h-12 text-base shadow-lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 h-12 text-base"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Key Features
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to manage your hall experience efficiently
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-primary-foreground mb-16">
            RUET Hall Management by Numbers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "5000+", label: "Students Managed" },
              { value: "12", label: "Residential Halls" },
              { value: "2500+", label: "Rooms Available" },
              { value: "99%", label: "System Uptime" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary-foreground">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/80 mt-2 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {[
              {
                title: "About",
                links: ["About RUET", "Contact Info", "Facilities"],
              },
              {
                title: "Support",
                links: ["Help Center", "Documentation", "Report Issue"],
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms & Conditions", "Disclaimer"],
              },
              {
                title: "Connect",
                links: ["Facebook", "Twitter", "Instagram"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h5 className="font-semibold text-foreground mb-4">
                  {section.title}
                </h5>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 RUET Hall Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
