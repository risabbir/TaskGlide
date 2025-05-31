
"use client";

import { useKanban } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DEFAULT_COLUMNS, PRIORITY_STYLES } from "@/lib/constants";
import { format } from "date-fns";

export function ActiveFilterPills() {
  const { state, dispatch } = useKanban();
  const { filters, columns } = state;

  const activePills = [];

  // Search Term Pill
  if (filters.searchTerm) {
    activePills.push({
      id: "searchTerm",
      label: `Search: "${filters.searchTerm}"`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } }),
    });
  }

  // Status pills (selected columns)
  const allColumnsSelected = filters.status.length === DEFAULT_COLUMNS.length;
  if (!allColumnsSelected && filters.status.length > 0) {
    if (filters.status.length === 1) {
      const column = columns.find(c => c.id === filters.status[0]);
      if (column) {
        activePills.push({
          id: `status-single-${column.id}`,
          label: `Status: ${column.title}`,
          onDismiss: () => {
            dispatch({ type: "SET_FILTERS", payload: { status: DEFAULT_COLUMNS.map(c => c.id) } });
          }
        });
      }
    } else { 
      activePills.push({
        id: `status-multiple`,
        label: `Status: ${filters.status.length} selected`,
        onDismiss: () => {
          dispatch({ type: "SET_FILTERS", payload: { status: DEFAULT_COLUMNS.map(c => c.id) } });
        }
      });
    }
  }

  if (filters.priority) {
    activePills.push({
      id: "priority",
      label: `Priority: ${PRIORITY_STYLES[filters.priority].label}`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { priority: undefined } }),
    });
  }

  // Predefined Due Date Filter
  if (filters.dueDate) {
    let dueDateLabel = "";
    switch (filters.dueDate) {
      case "overdue": dueDateLabel = "Overdue"; break;
      case "today": dueDateLabel = "Due Today"; break;
      case "thisWeek": dueDateLabel = "Due This Week"; break;
      case "none": dueDateLabel = "No Due Date"; break;
    }
    activePills.push({
      id: "predefinedDueDate",
      label: `Due: ${dueDateLabel}`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { dueDate: undefined } }),
    });
  }

  // Specific Due Date Start Filter
  if (filters.dueDateStart) {
    activePills.push({
      id: "dueDateStart",
      label: `Due After: ${format(filters.dueDateStart, "PP")}`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { dueDateStart: undefined } }),
    });
  }

  // Specific Due Date End Filter
  if (filters.dueDateEnd) {
    activePills.push({
      id: "dueDateEnd",
      label: `Due Before: ${format(filters.dueDateEnd, "PP")}`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { dueDateEnd: undefined } }),
    });
  }
  
  if (activePills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4 px-1">
      <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
      {activePills.map(pill => (
        <Badge key={pill.id} variant="outline" className="pl-2 pr-1 py-0.5 text-sm">
          {pill.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1 -mr-0.5 hover:bg-transparent"
            onClick={pill.onDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove filter</span>
          </Button>
        </Badge>
      ))}
      <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => dispatch({ type: "CLEAR_FILTERS" })}>
        Clear All
      </Button>
    </div>
  );
}
