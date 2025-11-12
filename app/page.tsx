'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Upload,
  Brain,
  Users,
  FileOutput,
  Sparkles,
  CheckCircle2,
  Loader2
} from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Legal Document Generation
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Draft Demand Letters in{' '}
            <span className="text-primary">Minutes, Not Hours</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automate your legal drafting workflow with AI. Upload documents, extract facts,
            generate professional demand letters, and collaborate in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild className="text-lg h-12 px-8">
              <Link href="/login">
                Get Started
                <FileText className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-12 px-8" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need to Draft Demand Letters
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From document upload to final export, our AI-powered workflow handles every step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-File Upload</CardTitle>
                <CardDescription>
                  Upload PDFs, Word docs, and text files. Our system handles them all.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Fact Extraction</CardTitle>
                <CardDescription>
                  Automatically extract and structure key facts from your source materials.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Outline Generation</CardTitle>
                <CardDescription>
                  AI creates a logical outline following standard demand letter structure.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Collaboration</CardTitle>
                <CardDescription>
                  Google Docs-style editing with live cursors and inline comments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Tone & Style Control</CardTitle>
                <CardDescription>
                  Choose from professional, assertive, or empathetic tones. Or create custom templates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileOutput className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Export to Any Format</CardTitle>
                <CardDescription>
                  Download your finished letter as DOCX, PDF, or plain text.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Simple 4-Step Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From upload to export in a streamlined process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: '1', title: 'Upload', desc: 'Add your source documents' },
              { step: '2', title: 'Extract Facts', desc: 'AI identifies key information' },
              { step: '3', title: 'Generate Draft', desc: 'Create outline and full letter' },
              { step: '4', title: 'Collaborate & Export', desc: 'Edit together and download' },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Why Legal Teams Choose Us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Reduce drafting time by 50% or more',
                'Maintain consistent tone and quality',
                'Collaborate seamlessly with your team',
                'Never lose work with auto-save',
                'Customizable templates for different case types',
                'Secure document storage and access control',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto bg-primary text-primary-foreground">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-3xl md:text-4xl">
                Ready to Transform Your Workflow?
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg">
                Join law firms using AI to draft better demand letters faster
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button size="lg" variant="secondary" className="text-lg h-12 px-8" asChild>
                <Link href="/login">
                  Start Now - It&apos;s Free
                  <FileText className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold">Demand Letter Generator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Steno. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
