import { useState, useEffect } from "react";
import { Plus, Search, Play, Pause, Settings, Zap, Clock, Target, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger_type: 'new_lead' | 'lead_status_change' | 'scheduled' | 'email_opened' | 'form_submitted';
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
  last_executed: string | null;
  execution_count: number;
}

const triggerTypes = {
  new_lead: { label: "New Lead", color: "bg-blue-100 text-blue-800" },
  lead_status_change: { label: "Lead Status Change", color: "bg-green-100 text-green-800" },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-800" },
  email_opened: { label: "Email Opened", color: "bg-orange-100 text-orange-800" },
  form_submitted: { label: "Form Submitted", color: "bg-teal-100 text-teal-800" }
};

const actionTemplates = [
  { id: 'send_email', label: 'Send Email', description: 'Send a personalized email to the lead' },
  { id: 'assign_agent', label: 'Assign Agent', description: 'Automatically assign the lead to an agent' },
  { id: 'create_task', label: 'Create Task', description: 'Create a follow-up task' },
  { id: 'update_status', label: 'Update Status', description: 'Change the lead status' },
  { id: 'send_sms', label: 'Send SMS', description: 'Send a text message to the lead' },
  { id: 'add_tag', label: 'Add Tag', description: 'Add a tag to the lead for categorization' }
];

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "new_lead" as AutomationWorkflow['trigger_type'],
    trigger_conditions: {},
    actions: [],
    is_active: false
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      toast({
        title: "Error fetching workflows",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingWorkflow) {
        const { error } = await supabase
          .from('automation_workflows')
          .update(formData)
          .eq('id', editingWorkflow.id);
        
        if (error) throw error;
        toast({ title: "Workflow updated successfully!" });
      } else {
        const { error } = await supabase
          .from('automation_workflows')
          .insert([formData]);
        
        if (error) throw error;
        toast({ title: "Workflow created successfully!" });
      }
      
      setIsDialogOpen(false);
      setEditingWorkflow(null);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      toast({
        title: "Error saving workflow",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleWorkflow = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast({ 
        title: `Workflow ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
      });
      fetchWorkflows();
    } catch (error) {
      toast({
        title: "Error updating workflow",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Workflow deleted successfully!" });
      fetchWorkflows();
    } catch (error) {
      toast({
        title: "Error deleting workflow",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "new_lead",
      trigger_conditions: {},
      actions: [],
      is_active: false
    });
  };

  const openEditDialog = (workflow: AutomationWorkflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      trigger_conditions: workflow.trigger_conditions || {},
      actions: workflow.actions || [],
      is_active: workflow.is_active
    });
    setIsDialogOpen(true);
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const workflowStats = {
    total: workflows.length,
    active: workflows.filter(w => w.is_active).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.execution_count, 0),
    avgExecutions: workflows.length > 0 ? workflows.reduce((sum, w) => sum + w.execution_count, 0) / workflows.length : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Studio</h1>
          <p className="text-muted-foreground">Create and manage automated workflows for your real estate business</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {resetForm(); setEditingWorkflow(null);}}>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWorkflow ? "Edit Workflow" : "Create New Workflow"}</DialogTitle>
              <DialogDescription>
                {editingWorkflow ? "Update workflow settings" : "Set up a new automated workflow"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Welcome New Leads"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe what this workflow does..."
                />
              </div>
              
              <div>
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select value={formData.trigger_type} onValueChange={(value: AutomationWorkflow['trigger_type']) => 
                  setFormData(prev => ({...prev, trigger_type: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead">New Lead</SelectItem>
                    <SelectItem value="lead_status_change">Lead Status Change</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="email_opened">Email Opened</SelectItem>
                    <SelectItem value="form_submitted">Form Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Quick Actions (Select one or more)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {actionTemplates.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <h4 className="font-medium text-sm">{action.label}</h4>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                />
                <Label htmlFor="is_active">Activate workflow immediately</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWorkflow ? "Update Workflow" : "Create Workflow"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats.totalExecutions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Executions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats.avgExecutions.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Workflow Templates</CardTitle>
          <CardDescription>Pre-built workflows you can customize and activate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-accent cursor-pointer">
              <h3 className="font-medium">Welcome New Leads</h3>
              <p className="text-sm text-muted-foreground mb-3">Send a welcome email and create a follow-up task when a new lead is created</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Email</Badge>
                <Badge variant="outline" className="text-xs">Task</Badge>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:bg-accent cursor-pointer">
              <h3 className="font-medium">Lead Nurture Sequence</h3>
              <p className="text-sm text-muted-foreground mb-3">Automated email sequence for leads who haven't been contacted</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Email</Badge>
                <Badge variant="outline" className="text-xs">Scheduled</Badge>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:bg-accent cursor-pointer">
              <h3 className="font-medium">Hot Lead Alert</h3>
              <p className="text-sm text-muted-foreground mb-3">Instantly notify agents when a high-value lead is created</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">SMS</Badge>
                <Badge variant="outline" className="text-xs">Assignment</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Workflows</CardTitle>
          <CardDescription>Manage and monitor your automated workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Last Executed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading workflows...
                  </TableCell>
                </TableRow>
              ) : filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No workflows found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-sm text-muted-foreground">{workflow.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={triggerTypes[workflow.trigger_type].color}>
                        {triggerTypes[workflow.trigger_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={workflow.is_active}
                          onCheckedChange={() => toggleWorkflow(workflow.id, workflow.is_active)}
                        />
                        <span className="text-sm">
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{workflow.execution_count}</TableCell>
                    <TableCell>
                      {workflow.last_executed 
                        ? new Date(workflow.last_executed).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>{new Date(workflow.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditDialog(workflow)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(workflow.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}