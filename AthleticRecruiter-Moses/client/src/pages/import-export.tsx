import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  FolderInput, 
  Download, 
  UploadIcon, 
  DownloadIcon,
  CheckCircleIcon,
  FileSpreadsheetIcon,
  AlertTriangleIcon
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

// Import form schema
const importFormSchema = z.object({
  dataType: z.string().min(1, "Data type is required"),
  format: z.string().min(1, "Format is required"),
  file: z.any().optional(),
});

// Export form schema
const exportFormSchema = z.object({
  dataType: z.string().min(1, "Data type is required"),
  format: z.string().min(1, "Format is required"),
});

type ImportFormValues = z.infer<typeof importFormSchema>;
type ExportFormValues = z.infer<typeof exportFormSchema>;

export default function ImportExport() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Setup import form
  const importForm = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      dataType: "coaches",
      format: "csv",
    }
  });

  // Setup export form
  const exportForm = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      dataType: "coaches",
      format: "csv",
    }
  });

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle import form submission
  const onImportSubmit = (data: ImportFormValues) => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsImporting(false);
        
        toast({
          title: "Import Successful",
          description: `${importFile.name} has been imported successfully.`,
        });
        
        importForm.reset({
          dataType: "coaches",
          format: "csv",
        });
        setImportFile(null);
      }
    }, 500);
  };

  // Handle export form submission
  const onExportSubmit = (data: ExportFormValues) => {
    setIsExporting(true);
    
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      
      toast({
        title: "Export Successful",
        description: `${data.dataType} data has been exported as ${data.format.toUpperCase()}.`,
      });
      
      // In a real app, this would trigger a file download
      const link = document.createElement("a");
      link.href = "#";
      link.download = `${data.dataType}_export.${data.format}`;
      link.click();
    }, 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Import & Export</h1>
        <p className="text-gray-600">Transfer data in and out of the system</p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Upload data from external sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...importForm}>
                <form onSubmit={importForm.handleSubmit(onImportSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={importForm.control}
                      name="dataType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select data type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="coaches">Coaches</SelectItem>
                              <SelectItem value="emails">Email History</SelectItem>
                              <SelectItem value="templates">Email Templates</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose what type of data you want to import
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={importForm.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select file format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the format of your import file
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {importFile ? (
                        <>
                          <FileSpreadsheetIcon className="h-10 w-10 text-primary" />
                          <p className="text-sm font-medium">{importFile.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(importFile.size / 1024)} KB</p>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setImportFile(null)}
                          >
                            Change File
                          </Button>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-10 w-10 text-gray-400" />
                          <h3 className="text-lg font-medium mt-2">Drop your file here or click to browse</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Supports CSV, Excel, and JSON formats
                          </p>
                          
                          <Input
                            type="file"
                            className="hidden"
                            id="file-upload"
                            accept=".csv,.xlsx,.json"
                            onChange={handleFileChange}
                          />
                          <Label 
                            htmlFor="file-upload" 
                            className="cursor-pointer inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background hover:bg-primary/90"
                          >
                            Choose File
                          </Label>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                  )}
                  
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                    <div className="flex">
                      <AlertTriangleIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">Important</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Make sure your file follows the required format. For templates, download the sample file below.
                        </p>
                        <Button 
                          variant="link" 
                          className="text-amber-800 p-0 h-auto mt-1"
                          size="sm"
                        >
                          Download template file
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isImporting || !importFile}
                    >
                      {isImporting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Importing...
                        </div>
                      ) : (
                        <>
                          <FolderInput className="h-4 w-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...exportForm}>
                <form onSubmit={exportForm.handleSubmit(onExportSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={exportForm.control}
                      name="dataType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select data type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="coaches">Coaches</SelectItem>
                              <SelectItem value="emails">Email History</SelectItem>
                              <SelectItem value="templates">Email Templates</SelectItem>
                              <SelectItem value="all_data">All Data</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose what data you want to export
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={exportForm.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Export Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select export format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the format for your exported data
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="rounded-lg bg-gray-50 p-6 flex flex-col items-center justify-center">
                    <DownloadIcon className="h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">Ready to Export Your Data</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md mt-1 mb-4">
                      Export your data for backup or analysis in other tools. All data will be formatted according to your selection.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </div>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
