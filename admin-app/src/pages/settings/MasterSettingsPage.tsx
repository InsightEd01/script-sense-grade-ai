import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Slider } from '../../components/ui/slider';
import { toast } from '../../components/ui/use-toast';
import { Building2, Shield, Gauge, Globe } from 'lucide-react';

export const MasterSettingsPage = () => {
  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    multiTenancyEnabled: true,
    maxSchoolsPerAdmin: 10,
    maxUsersPerSchool: 100,
    defaultStorageLimit: 5, // GB
    enableAutomaticBackups: true,
    backupFrequency: 24, // hours
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireMfa: false,
    sessionTimeout: 24, // hours
    ipWhitelisting: false,
    auditLogging: true,
  });

  // Performance settings state
  const [performanceSettings, setPerformanceSettings] = useState({
    cacheTimeout: 60, // minutes
    maxConcurrentUsers: 1000,
    requestRateLimit: 100, // per minute
    loadBalancingEnabled: true,
  });

  const handleSystemSettingChange = (key: keyof typeof systemSettings, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: "System settings have been saved successfully.",
    });
  };

  const handleSecuritySettingChange = (key: keyof typeof securitySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: "Security settings have been saved successfully.",
    });
  };

  const handlePerformanceSettingChange = (key: keyof typeof performanceSettings, value: any) => {
    setPerformanceSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: "Performance settings have been saved successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Master System Settings</h1>
            <p className="text-muted-foreground">Configure global system settings and policies</p>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Manage multi-tenancy and system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                      <span>Multi-tenancy Mode</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Enable support for multiple schools
                      </span>
                    </Label>
                    <Switch
                      checked={systemSettings.multiTenancyEnabled}
                      onCheckedChange={(checked) => 
                        handleSystemSettingChange('multiTenancyEnabled', checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Schools per Admin</Label>
                    <Input
                      type="number"
                      value={systemSettings.maxSchoolsPerAdmin}
                      onChange={(e) => 
                        handleSystemSettingChange('maxSchoolsPerAdmin', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Users per School</Label>
                    <Input
                      type="number"
                      value={systemSettings.maxUsersPerSchool}
                      onChange={(e) => 
                        handleSystemSettingChange('maxUsersPerSchool', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                      <span>Automatic Backups</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Enable automated system backups
                      </span>
                    </Label>
                    <Switch
                      checked={systemSettings.enableAutomaticBackups}
                      onCheckedChange={(checked) => 
                        handleSystemSettingChange('enableAutomaticBackups', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure system security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => 
                        handleSecuritySettingChange('passwordMinLength', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                      <span>Require MFA</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Enable multi-factor authentication
                      </span>
                    </Label>
                    <Switch
                      checked={securitySettings.requireMfa}
                      onCheckedChange={(checked) => 
                        handleSecuritySettingChange('requireMfa', checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout (hours)</Label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => 
                        handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                      <span>Audit Logging</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Track all system changes
                      </span>
                    </Label>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => 
                        handleSecuritySettingChange('auditLogging', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Optimize system performance and resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cache Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={performanceSettings.cacheTimeout}
                      onChange={(e) => 
                        handlePerformanceSettingChange('cacheTimeout', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Concurrent Users</Label>
                    <Input
                      type="number"
                      value={performanceSettings.maxConcurrentUsers}
                      onChange={(e) => 
                        handlePerformanceSettingChange('maxConcurrentUsers', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Request Rate Limit (per minute)</Label>
                    <Input
                      type="number"
                      value={performanceSettings.requestRateLimit}
                      onChange={(e) => 
                        handlePerformanceSettingChange('requestRateLimit', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col gap-1">
                      <span>Load Balancing</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Enable automatic load distribution
                      </span>
                    </Label>
                    <Switch
                      checked={performanceSettings.loadBalancingEnabled}
                      onCheckedChange={(checked) => 
                        handlePerformanceSettingChange('loadBalancingEnabled', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
