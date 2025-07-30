import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Megaphone,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  Clock,
  Target
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data
const performanceData = [
  { month: "Jan", leads: 45, conversions: 12, revenue: 180000 },
  { month: "Feb", leads: 52, conversions: 15, revenue: 220000 },
  { month: "Mar", leads: 38, conversions: 8, revenue: 120000 },
  { month: "Apr", leads: 61, conversions: 18, revenue: 280000 },
  { month: "May", leads: 67, conversions: 22, revenue: 340000 },
  { month: "Jun", leads: 73, conversions: 25, revenue: 380000 },
];

const leadSources = [
  { name: "Facebook Ads", value: 45, color: "#3b82f6" },
  { name: "Google Ads", value: 30, color: "#10b981" },
  { name: "Referrals", value: 15, color: "#f59e0b" },
  { name: "Direct", value: 10, color: "#8b5cf6" },
];

const recentLeads = [
  { id: 1, name: "Sarah Johnson", type: "Buyer", source: "Facebook", score: 8.5, time: "2 min ago", status: "new" },
  { id: 2, name: "Michael Chen", type: "Seller", source: "Google", score: 9.2, time: "5 min ago", status: "qualified" },
  { id: 3, name: "Emily Davis", type: "Buyer", source: "Referral", score: 7.8, time: "12 min ago", status: "contacted" },
  { id: 4, name: "Robert Wilson", type: "Seller", source: "Direct", score: 6.5, time: "25 min ago", status: "new" },
  { id: 5, name: "Lisa Anderson", type: "Buyer", source: "Facebook", score: 8.9, time: "1 hour ago", status: "qualified" },
];

const upcomingTasks = [
  { id: 1, title: "Call Sarah Johnson", type: "call", time: "10:00 AM", priority: "high" },
  { id: 2, title: "Property showing - 123 Oak St", type: "showing", time: "2:00 PM", priority: "medium" },
  { id: 3, title: "Follow up with Michael Chen", type: "email", time: "4:30 PM", priority: "high" },
  { id: 4, title: "Team meeting", type: "meeting", time: "Tomorrow 9:00 AM", priority: "low" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-800";
    case "qualified": return "bg-green-100 text-green-800";
    case "contacted": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task completed successfully"
      });

      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

export default function DashboardOverview() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    activeCampaigns: 0,
    recentLeads: [],
    upcomingTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');

      if (campaignsError) throw campaignsError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(4);

      if (tasksError) throw tasksError;

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const qualifiedLeads = leads?.filter(lead => lead.status === 'ai_qualified' || lead.status === 'contacted').length || 0;
      const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads * 100) : 0;
      const monthlyRevenue = campaigns?.reduce((sum, campaign) => sum + (campaign.budget || 0), 0) || 0;
      const activeCampaigns = campaigns?.length || 0;

      setDashboardData({
        totalLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        monthlyRevenue,
        activeCampaigns,
        recentLeads: leads?.slice(0, 5) || [],
        upcomingTasks: tasks || []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button>
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
                <p className="text-sm font-medium text-muted-foreground">Revenue (MTD)</p>
                <p className="text-2xl font-bold">{loading ? "..." : `$${Math.round(dashboardData.monthlyRevenue / 1000)}K`}</p>
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
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {leadSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
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
              <Button variant="ghost" size="sm">View All</Button>
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
                          <span>{lead.property_type || 'Unknown'}</span>
                          <span>•</span>
                          <span>{lead.source}</span>
                          <span>•</span>
                          <span>Score: {lead.ai_score || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(lead.status)} variant="secondary">
                        {lead.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
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
              <Button variant="ghost" size="sm">
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
                  <div key={task.id} className={`flex items-center gap-3 p-3 border-l-4 ${getPriorityColor(task.priority)} bg-muted/30 rounded-r-lg`}>
                    <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                      {task.task_type === "call" && <Phone className="w-4 h-4" />}
                      {task.task_type === "email" && <Mail className="w-4 h-4" />}
                      {task.task_type === "showing" && <Calendar className="w-4 h-4" />}
                      {task.task_type === "meeting" && <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      Complete
                    </Button>
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
    </div>
  );
}