import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  Users,
  TrendingUp,
  DollarSign,
  Megaphone,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  MessageSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  Pencil,
  Trash2
} from "lucide-react";

import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

// Helpers
const toISODate = (d: Date | undefined | null) => (d ? d.toISOString().slice(0, 10) : null);
const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: "short" });

const SOURCE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#22c55e"]; // semantic palette mapping

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  status: string;
  source?: string | null;
  lead_source?: string | null;
  property_type?: string | null;
  ai_score?: number | null;
  property_interest?: string | null;
  budget_range?: string | null;
  notes?: string | null;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  completed: boolean;
  priority: string; // low | medium | high
  task_type?: string | null; // call | email | showing | meeting
}

interface Campaign {
  id: string;
  name: string;
  type: string; // email | social | sms | ads
  status: string; // draft | active | paused | completed
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  target_audience?: string | null;
  goals?: string | null;
}

export default function DashboardOverview() {
  const { toast } = useToast();

  // KPI + lists
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    activeCampaigns: 0,
    recentLeads: [] as Lead[],
    upcomingTasks: [] as Task[],
    campaigns: [] as Campaign[],
  });
  const [loading, setLoading] = useState(true);

  // Live charts
  const [performanceData, setPerformanceData] = useState<{ month: string; leads: number; conversions: number }[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<{ name: string; value: number; color: string }[]>([]);

  // Lead dialog state
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "new",
    lead_source: "",
    property_type: "",
    property_interest: "",
    budget_range: "",
    notes: ""
  });

  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDue, setTaskDue] = useState<Date | undefined>();
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    task_type: "call",
  });

  // Campaign dialog state (Create only from overview)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignStart, setCampaignStart] = useState<Date | undefined>();
  const [campaignEnd, setCampaignEnd] = useState<Date | undefined>();
  const [campaignForm, setCampaignForm] = useState<Partial<Campaign>>({
    name: "",
    type: "email",
    status: "draft",
    budget: 0,
    target_audience: "",
    goals: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Leads
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (leadsError) throw leadsError;

      // Campaigns (active)
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active");
      if (campaignsError) throw campaignsError;

      // Tasks (incomplete upcoming few)
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("completed", false)
        .order("due_date", { ascending: true })
        .limit(6);
      if (tasksError) throw tasksError;

      // KPI metrics
      const totalLeads = leads?.length || 0;
      const conversions = (leads || []).filter(l => ["closed_won", "won", "converted"].includes(String(l.status))).length;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
      const monthlyRevenue = (campaigns || []).reduce((sum, c: any) => sum + (Number(c.budget) || 0), 0);
      const activeCampaigns = campaigns?.length || 0;

      // Live charts
      setPerformanceData(buildPerformanceData(leads || []));
      setLeadSourceData(buildLeadSources(leads || []));

      setDashboardData({
        totalLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        monthlyRevenue,
        activeCampaigns,
        recentLeads: (leads || []).slice(0, 5) as Lead[],
        upcomingTasks: (tasks || []) as Task[]
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Charts builders
  const buildPerformanceData = (leads: Lead[]) => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: monthLabel(d), d };
    });

    const byMonth = months.map(m => {
      const leadsCount = leads.filter(l => {
        const dt = new Date(l.created_at);
        return dt.getFullYear() === m.d.getFullYear() && dt.getMonth() === m.d.getMonth();
      }).length;
      const conversions = leads.filter(l => {
        const dt = new Date(l.created_at);
        const isConv = ["closed_won", "won", "converted"].includes(String(l.status));
        return isConv && dt.getFullYear() === m.d.getFullYear() && dt.getMonth() === m.d.getMonth();
      }).length;
      return { month: m.label, leads: leadsCount, conversions };
    });
    return byMonth;
  };

  const buildLeadSources = (leads: Lead[]) => {
    const counts: Record<string, number> = {};
    for (const l of leads) {
      const src = (l.lead_source || l.source || "Unknown").trim() || "Unknown";
      counts[src] = (counts[src] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], idx) => ({ name, value: Math.round((count / total) * 100), color: SOURCE_COLORS[idx % SOURCE_COLORS.length] }));
    return entries;
  };

  // CRUD: Tasks
  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed: true }).eq("id", taskId);
      if (error) throw error;
      toast({ title: "Success", description: "Task completed successfully" });
      fetchDashboardData();
    } catch (error) {
      console.error("Error completing task:", error);
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    }
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({ title: "", description: "", priority: "medium", task_type: "call" });
    setTaskDue(undefined);
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setTaskDue(task.due_date ? new Date(task.due_date) : undefined);
    setTaskDialogOpen(true);
  };

  const submitTask = async () => {
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority || "medium",
        task_type: taskForm.task_type || null,
        due_date: toISODate(taskDue),
        completed: false,
      } as any;

      if (editingTask) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
        if (error) throw error;
        toast({ title: "Task updated" });
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
        toast({ title: "Task created" });
      }
      setTaskDialogOpen(false);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not save task", variant: "destructive" });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Task deleted" });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not delete task", variant: "destructive" });
    }
  };

  // CRUD: Leads
  const openNewLead = () => {
    setEditingLead(null);
    setLeadForm({ first_name: "", last_name: "", email: "", phone: "", status: "new", lead_source: "", property_type: "", property_interest: "", budget_range: "", notes: "" });
    setLeadDialogOpen(true);
  };

  const openEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      status: lead.status || "new",
      lead_source: lead.lead_source || lead.source || "",
      property_type: lead.property_type || "",
      property_interest: lead.property_interest || "",
      budget_range: lead.budget_range || "",
      notes: lead.notes || "",
    });
    setLeadDialogOpen(true);
  };

  const submitLead = async () => {
    try {
      const payload: any = {
        first_name: leadForm.first_name || null,
        last_name: leadForm.last_name || null,
        email: leadForm.email || "",
        phone: leadForm.phone || null,
        status: leadForm.status || "new",
        lead_source: leadForm.lead_source || null,
        property_type: leadForm.property_type || null,
        property_interest: leadForm.property_interest || null,
        budget_range: leadForm.budget_range || null,
        notes: leadForm.notes || null,
      };

      if (editingLead) {
        const { error } = await supabase.from("leads").update(payload).eq("id", editingLead.id);
        if (error) throw error;
        toast({ title: "Lead updated" });
      } else {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
        toast({ title: "Lead created" });
      }
      setLeadDialogOpen(false);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not save lead", variant: "destructive" });
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Lead deleted" });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not delete lead", variant: "destructive" });
    }
  };

  // Create Campaign (from header button)
  const submitCampaign = async () => {
    try {
      const payload: any = {
        name: campaignForm.name,
        type: campaignForm.type || "email",
        status: campaignForm.status || "draft",
        budget: Number(campaignForm.budget) || 0,
        start_date: toISODate(campaignStart),
        end_date: toISODate(campaignEnd),
        target_audience: campaignForm.target_audience || null,
        goals: campaignForm.goals || null,
      };
      const { error } = await supabase.from("campaigns").insert(payload);
      if (error) throw error;
      toast({ title: "Campaign created" });
      setCampaignDialogOpen(false);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not create campaign", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Good morning, John! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <CalendarIcon className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button onClick={() => setCampaignDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{loading ? "..." : dashboardData.totalLeads}</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{loading ? "..." : `${dashboardData.conversionRate}%`}</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ad Spend (Active)</p>
                <p className="text-2xl font-bold">{loading ? "..." : `$${Math.round(dashboardData.monthlyRevenue)}`}</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  -3% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{loading ? "..." : dashboardData.activeCampaigns}</p>
                <p className="text-xs text-success flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  2 new this week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Performance Overview
              <Badge variant="secondary">Last 6 months</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="conversions" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {leadSourceData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {leadSourceData.map((source, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm">{source.name}</span>
                  <span className="text-sm font-medium ml-auto">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Tasks Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Lead Activity
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={openNewLead}>
                  <Plus className="w-4 h-4 mr-1" /> Add Lead
                </Button>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : dashboardData.recentLeads.length === 0 ? (
                <div className="text-center text-muted-foreground">No recent leads</div>
              ) : (
                dashboardData.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{lead.property_type || "Unknown"}</span>
                          <span>•</span>
                          <span>{lead.lead_source || lead.source || ""}</span>
                          <span>•</span>
                          <span>Score: {lead.ai_score ?? "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="secondary">{lead.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="Edit lead" onClick={() => openEditLead(lead)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete lead" onClick={() => deleteLead(lead.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Today's Tasks
              <Button variant="ghost" size="sm" onClick={openNewTask}>
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : dashboardData.upcomingTasks.length === 0 ? (
                <div className="text-center text-muted-foreground">No upcoming tasks</div>
              ) : (
                dashboardData.upcomingTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 border-l-4 ${task.priority === "high" ? "border-l-red-500" : task.priority === "medium" ? "border-l-yellow-500" : "border-l-green-500"} bg-muted/30 rounded-r-lg`}>
                    <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                      {task.task_type === "call" && <Phone className="w-4 h-4" />}
                      {task.task_type === "email" && <Mail className="w-4 h-4" />}
                      {task.task_type === "showing" && <CalendarIcon className="w-4 h-4" />}
                      {task.task_type === "meeting" && <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCompleteTask(task.id)}>Complete</Button>
                      <Button variant="ghost" size="icon" aria-label="Edit task" onClick={() => openEditTask(task)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete task" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Copilot Quick Actions */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI Copilot is ready to help</h3>
                <p className="text-sm text-muted-foreground">Ask me anything about your leads, campaigns, or market insights</p>
              </div>
            </div>
            <Button>
              Start Conversation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "New Lead"}</DialogTitle>
            <DialogDescription>Manage your lead details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={leadForm.first_name || ""} onChange={(e) => setLeadForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={leadForm.last_name || ""} onChange={(e) => setLeadForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={leadForm.email || ""} onChange={(e) => setLeadForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={leadForm.phone || ""} onChange={(e) => setLeadForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={leadForm.status || "new"} onValueChange={(v) => setLeadForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Source</Label>
              <Input value={leadForm.lead_source || ""} onChange={(e) => setLeadForm(f => ({ ...f, lead_source: e.target.value }))} />
            </div>
            <div>
              <Label>Property Type</Label>
              <Input value={leadForm.property_type || ""} onChange={(e) => setLeadForm(f => ({ ...f, property_type: e.target.value }))} />
            </div>
            <div>
              <Label>Interest</Label>
              <Input value={leadForm.property_interest || ""} onChange={(e) => setLeadForm(f => ({ ...f, property_interest: e.target.value }))} />
            </div>
            <div>
              <Label>Budget Range</Label>
              <Input value={leadForm.budget_range || ""} onChange={(e) => setLeadForm(f => ({ ...f, budget_range: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={leadForm.notes || ""} onChange={(e) => setLeadForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitLead}>{editingLead ? "Save changes" : "Create lead"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            <DialogDescription>Plan and track your tasks</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input value={taskForm.title || ""} onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={taskForm.description || ""} onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={taskForm.priority || "medium"} onValueChange={(v) => setTaskForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={taskForm.task_type || "call"} onValueChange={(v) => setTaskForm(f => ({ ...f, task_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="showing">Showing</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {taskDue ? taskDue.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={taskDue} onSelect={setTaskDue} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitTask}>{editingTask ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>Create a campaign to start tracking</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Name</Label>
              <Input value={campaignForm.name || ""} onChange={(e) => setCampaignForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={campaignForm.type || "email"} onValueChange={(v) => setCampaignForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={campaignForm.status || "draft"} onValueChange={(v) => setCampaignForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget</Label>
              <Input type="number" value={String(campaignForm.budget ?? 0)} onChange={(e) => setCampaignForm(f => ({ ...f, budget: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">{campaignStart ? campaignStart.toLocaleDateString() : "Pick a date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={campaignStart} onSelect={setCampaignStart} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">{campaignEnd ? campaignEnd.toLocaleDateString() : "Pick a date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={campaignEnd} onSelect={setCampaignEnd} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-2">
              <Label>Target Audience</Label>
              <Input value={campaignForm.target_audience || ""} onChange={(e) => setCampaignForm(f => ({ ...f, target_audience: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Goals</Label>
              <Textarea value={campaignForm.goals || ""} onChange={(e) => setCampaignForm(f => ({ ...f, goals: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCampaign}>Create campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
