-- Create enum types
CREATE TYPE public.lead_status AS ENUM ('new', 'ai_qualified', 'contacted', 'scheduled', 'under_contract', 'closed_won', 'closed_lost');
CREATE TYPE public.campaign_status AS ENUM ('active', 'paused', 'completed', 'draft');
CREATE TYPE public.campaign_platform AS ENUM ('facebook', 'google', 'instagram', 'linkedin');
CREATE TYPE public.property_type AS ENUM ('house', 'condo', 'apartment', 'commercial', 'land');
CREATE TYPE public.lead_source AS ENUM ('facebook', 'google', 'referral', 'direct', 'website', 'phone');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source NOT NULL,
  property_type property_type,
  price_range_min INTEGER,
  price_range_max INTEGER,
  location TEXT,
  ai_score DECIMAL(3,1),
  priority priority_level DEFAULT 'medium',
  notes TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_follow_up TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform campaign_platform NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  creative_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  priority priority_level DEFAULT 'medium',
  task_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_workflows table
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  workflow_steps JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for automation workflows
CREATE POLICY "Users can view their own workflows" ON public.automation_workflows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workflows" ON public.automation_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflows" ON public.automation_workflows
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workflows" ON public.automation_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for development
INSERT INTO public.leads (user_id, first_name, last_name, email, phone, status, source, property_type, price_range_min, price_range_max, location, ai_score, priority, notes) VALUES
  (auth.uid(), 'Sarah', 'Johnson', 'sarah.j@email.com', '(555) 123-4567', 'ai_qualified', 'facebook', 'condo', 300000, 450000, 'Downtown', 8.5, 'high', 'Looking for first home, pre-approved for $400K'),
  (auth.uid(), 'Michael', 'Chen', 'michael.chen@email.com', '(555) 234-5678', 'contacted', 'google', 'house', 500000, 750000, 'Suburbs', 9.2, 'high', 'Looking to upgrade from current home'),
  (auth.uid(), 'Emily', 'Davis', 'emily.davis@email.com', '(555) 345-6789', 'new', 'referral', 'apartment', 200000, 350000, 'Midtown', 7.8, 'medium', 'First time renter looking to buy'),
  (auth.uid(), 'Robert', 'Wilson', 'robert.wilson@email.com', '(555) 456-7890', 'scheduled', 'direct', 'house', 600000, 900000, 'Uptown', 6.5, 'medium', 'Interested in luxury properties'),
  (auth.uid(), 'Lisa', 'Anderson', 'lisa.anderson@email.com', '(555) 567-8901', 'under_contract', 'website', 'condo', 400000, 600000, 'Waterfront', 8.9, 'high', 'Quick decision maker, cash buyer');

INSERT INTO public.campaigns (user_id, name, platform, status, budget, spent, impressions, clicks, leads_generated, start_date, end_date) VALUES
  (auth.uid(), 'First Time Buyer - Downtown Condos', 'facebook', 'active', 1500.00, 847.23, 45230, 892, 23, '2024-01-01', '2024-01-31'),
  (auth.uid(), 'Luxury Home Sellers - Westside', 'google', 'active', 2000.00, 1243.56, 32145, 634, 18, '2024-01-01', '2024-02-29'),
  (auth.uid(), 'Open House This Weekend', 'instagram', 'completed', 500.00, 489.12, 12350, 245, 8, '2024-01-15', '2024-01-22'),
  (auth.uid(), 'Investment Property Buyers', 'linkedin', 'paused', 1000.00, 234.78, 8940, 178, 5, '2024-01-10', '2024-02-10');

INSERT INTO public.tasks (user_id, title, description, due_date, priority, task_type) VALUES
  (auth.uid(), 'Call Sarah Johnson', 'Follow up on condo inquiry', now() + interval '2 hours', 'high', 'call'),
  (auth.uid(), 'Property showing - 123 Oak St', 'Show luxury home to Robert Wilson', now() + interval '4 hours', 'medium', 'showing'),
  (auth.uid(), 'Follow up with Michael Chen', 'Send additional property listings', now() + interval '6 hours', 'high', 'email'),
  (auth.uid(), 'Team meeting', 'Weekly sales meeting', now() + interval '1 day', 'low', 'meeting');