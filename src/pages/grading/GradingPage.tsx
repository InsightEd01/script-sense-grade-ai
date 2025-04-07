
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const GradingPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grading</h1>
            <p className="text-gray-500">Upload, process, and grade answer scripts.</p>
          </div>
          <Button className="bg-scriptsense-primary hover:bg-blue-800">
            <Upload className="mr-2 h-4 w-4" />
            Upload Scripts
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Answer Script Management</CardTitle>
            <CardDescription>
              Process and grade student answer scripts using OCR and AI.
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search scripts..."
                  className="pl-8"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <p className="text-muted-foreground">You'll be able to manage grading of answer scripts here once implemented.</p>
              <p className="text-muted-foreground text-sm mt-2">This page is under development.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GradingPage;
