import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

const SettingsPage = () => {
  const [ocrSensitivity, setOcrSensitivity] = useState([75]);
  const [llmTemperature, setLlmTemperature] = useState([0.2]);
  const [autoGrading, setAutoGrading] = useState(true);
  const [qrDetection, setQrDetection] = useState(true);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-gray-500">Configure system-wide settings for Stylus (Formally scriptSense ai).</p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ocr">OCR Settings</TabsTrigger>
            <TabsTrigger value="llm">LLM Configuration</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings for Stylus (Formally scriptSense ai).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-grading">Automatic Grading</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically start grading after OCR processing
                      </p>
                    </div>
                    <Switch
                      id="auto-grading"
                      checked={autoGrading}
                      onCheckedChange={setAutoGrading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="qr-detection">QR Code Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Attempt to detect QR codes on uploaded scripts
                      </p>
                    </div>
                    <Switch
                      id="qr-detection"
                      checked={qrDetection}
                      onCheckedChange={setQrDetection}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system-email">System Email</Label>
                  <Input
                    id="system-email"
                    placeholder="system@stylus.insighted.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email used for system notifications (not implemented)
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* OCR Settings */}
          <TabsContent value="ocr">
            <Card>
              <CardHeader>
                <CardTitle>OCR Configuration</CardTitle>
                <CardDescription>
                  Adjust settings for optical character recognition.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ocr-sensitivity">OCR Sensitivity</Label>
                      <span className="text-sm text-muted-foreground">{ocrSensitivity}%</span>
                    </div>
                    <Slider
                      id="ocr-sensitivity"
                      value={ocrSensitivity}
                      onValueChange={setOcrSensitivity}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Higher sensitivity may detect more text but introduce more errors
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preprocessing">Image Preprocessing</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="binarization" className="rounded" defaultChecked />
                      <label htmlFor="binarization" className="text-sm">Binarization</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="noise-removal" className="rounded" defaultChecked />
                      <label htmlFor="noise-removal" className="text-sm">Noise Removal</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="contrast-adjustment" className="rounded" defaultChecked />
                      <label htmlFor="contrast-adjustment" className="text-sm">Contrast Adjustment</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="deskew" className="rounded" defaultChecked />
                      <label htmlFor="deskew" className="text-sm">Deskew</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">OCR Language</Label>
                  <select id="language" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="eng">English</option>
                    <option value="fra">French</option>
                    <option value="spa">Spanish</option>
                    <option value="deu">German</option>
                    <option value="chi_sim">Chinese (Simplified)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* LLM Settings */}
          <TabsContent value="llm">
            <Card>
              <CardHeader>
                <CardTitle>LLM Configuration</CardTitle>
                <CardDescription>
                  Adjust settings for the language model used for grading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="llm-temperature">LLM Temperature</Label>
                      <span className="text-sm text-muted-foreground">{llmTemperature}</span>
                    </div>
                    <Slider
                      id="llm-temperature"
                      value={llmTemperature}
                      onValueChange={setLlmTemperature}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Lower values make the model more deterministic, higher values more creative
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">Gemini API Key</Label>
                  <Input
                    id="api-key"
                    placeholder="AIzaSyBBguG3m3mglvQzUXALiTccH73gpRFM1c8"
                    type="password"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key for the Gemini model
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model-version">Model Version</Label>
                  <select id="model-version" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="gemini-2.0-flash">Gemini 2.0 Pro</option>
                    <option value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-tolerance">Default Grading Tolerance</Label>
                  <Input
                    id="default-tolerance"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                  />
                  <p className="text-sm text-muted-foreground">
                    Default semantic similarity threshold (0-1) for new questions
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
