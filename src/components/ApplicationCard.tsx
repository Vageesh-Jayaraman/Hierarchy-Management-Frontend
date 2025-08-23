import { Link } from 'react-router-dom';
import { TreePine, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Application } from '@/lib/api';

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-gradient-subtle border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary shadow-sm">
            <TreePine className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {application.name}
            </h3>
            <p className="text-sm text-muted-foreground">ID: {application.id}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">
          Manage hierarchy structure, roles, and permissions for this application.
        </p>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          asChild 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
        >
          <Link to={`/app/${application.id}`} className="flex items-center justify-center gap-2">
            Open Application
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}