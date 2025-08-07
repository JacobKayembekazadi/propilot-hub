import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  lead_source: string;
  property_interest: string;
  budget_range: string;
  notes: string;
  created_at: string;
}

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "closed_won"
  | "closed_lost";

const COLUMNS: { key: LeadStatus; title: string }[] = [
  { key: "new", title: "New" },
  { key: "contacted", title: "Contacted" },
  { key: "qualified", title: "Qualified" },
  { key: "proposal", title: "Proposal" },
  { key: "closed_won", title: "Closed Won" },
  { key: "closed_lost", title: "Closed Lost" },
];


export default function LeadsKanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Leads Kanban | Agent Control Center"; // SEO title under 60 chars
  }, []);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      toast({ title: "Failed to load leads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const destStatus = destination.droppableId as LeadStatus;
    const srcStatus = source.droppableId as LeadStatus;
    if (destStatus === srcStatus) return;

    // optimistic UI
    setLeads((prev) =>
      prev.map((l) => (l.id === draggableId ? { ...l, status: destStatus } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({ status: destStatus })
      .eq("id", draggableId);

    if (error) {
      // revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === draggableId ? { ...l, status: srcStatus } : l))
      );
      toast({ title: "Could not move lead", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead updated", description: `Moved to ${destStatus}` });
    }
  };

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.lead_source?.toLowerCase() || "").includes(s)
    );
  });

  const byStatus = (status: LeadStatus) => filtered.filter((l) => l.status === status);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Kanban</h1>
          <p className="text-muted-foreground">Drag leads across stages to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/leads">
            <Button variant="outline">Table View</Button>
          </Link>
        </div>
      </header>

      <div className="flex gap-4 items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by name, email, or source"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search leads"
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {COLUMNS.map((col) => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{col.title}</span>
                        <Badge variant="secondary">{byStatus(col.key).length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 min-h-6">
                        {loading ? (
                          <li className="text-sm text-muted-foreground">Loading...</li>
                        ) : (
                          byStatus(col.key).map((lead, index) => (
                            <Draggable draggableId={lead.id} index={index} key={lead.id}>
                              {(dragProvided, snapshot) => (
                                <li
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                >
                                  <Card className="shadow-sm">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{lead.name}</div>
                                        <Badge variant="outline">{lead.status.replace("_", " ")}</Badge>
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate">{lead.email}</div>
                                      <div className="text-sm">{lead.property_interest || "-"}</div>
                                      <div className="text-xs text-muted-foreground">{lead.lead_source || ""}</div>
                                    </CardContent>
                                  </Card>
                                </li>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
