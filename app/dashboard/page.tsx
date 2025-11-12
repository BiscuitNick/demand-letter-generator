'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2, Clock, User } from "lucide-react";

interface Document {
  id: string;
  title: string;
  status: 'draft' | 'final';
  updatedAt: Timestamp;
  ownerId: string;
  collaborators?: string[];
}

interface Template {
  id: string;
  name: string;
  isDefault?: boolean;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's documents
    const docsQuery = query(
      collection(db, 'documents'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching documents:', error);
      setLoading(false);
    });

    // Subscribe to templates
    const templatesQuery = query(
      collection(db, 'templates'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const temps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Template));
      setTemplates(temps);
    }, (error) => {
      console.error('Error fetching templates:', error);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeTemplates();
    };
  }, [user]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your demand letters and documents
          </p>
        </div>
        <Button size="lg" onClick={() => router.push('/documents/new')}>
          <Plus className="mr-2 h-5 w-5" />
          New Demand Letter
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Documents Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              Your most recently edited demand letters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No documents yet. Create your first demand letter to get started.
                </p>
                <Button onClick={() => router.push('/documents/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">{doc.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(doc.updatedAt)}
                          </span>
                          {doc.collaborators && doc.collaborators.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={doc.status === 'final' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Card */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Saved templates for quick generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  No templates yet.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/templates">
                    Manage Templates
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 rounded-md border text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link href="/templates">
                    View All Templates
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">
                  {documents.filter(d => d.status === 'draft').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">
                  {documents.filter(d => d.status === 'final').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">{templates.length}</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
