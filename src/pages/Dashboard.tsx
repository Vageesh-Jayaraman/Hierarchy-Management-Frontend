import { useState, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ApplicationCard } from '@/components/ApplicationCard';
import { CreateApplicationModal } from '@/components/modals/CreateApplicationModal';
import { Application, applicationAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadApplications = async () => {
    try {
      const apps = await applicationAPI.getAll();
      setApplications(apps);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load applications. Please check your backend connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-1">
              Manage your hierarchy structures and permissions
            </p>
          </div>
          <CreateApplicationModal onSuccess={loadApplications} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Get started by creating your first application to manage hierarchies and permissions.
            </p>
            <CreateApplicationModal onSuccess={loadApplications} />
          </div>
        )}
      </main>
    </div>
  );
}