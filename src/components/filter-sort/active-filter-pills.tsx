
"use client";

import { useKanban } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DEFAULT_COLUMNS, PRIORITY_STYLES } from "@/lib/constants";

export function ActiveFilterPills() {
  const { state, dispatch } = useKanban();
  const { filters, columns } = state;

  const activePills = [];

  // Status pills (selected columns)
  const allColumnsSelected = filters.status.length === DEFAULT_COLUMNS.length;
  const noColumnsExplicitlySelected = filters.status.length === 0; // Should not happen if unchecking last resets to all

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
    } else { // Multiple (but not all) columns selected
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

  if (filters.dueDate) {
    let dueDateLabel = "";
    switch (filters.dueDate) {
      case "overdue": dueDateLabel = "Overdue"; break;
      case "today": dueDateLabel = "Due Today"; break;
      case "thisWeek": dueDateLabel = "Due This Week"; break;
      case "none": dueDateLabel = "No Due Date"; break;
    }
    activePills.push({
      id: "dueDate",
      label: `Due: ${dueDateLabel}`,
      onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { dueDate: undefined } }),
    });
  }

  // Search term is handled by the search input's clear button
  // if (filters.searchTerm) {
  //   activePills.push({
  //     id: "search",
  //     label: `Search: "${filters.searchTerm}"`,
  //     onDismiss: () => dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } }),
  //   });
  // }

  if (activePills.length === 0 && !filters.searchTerm) { // Only return null if no pills AND no search term
    return null;
  }
  
  if (activePills.length === 0 && filters.searchTerm) { // Only search term is active
     return (
        <div className="flex flex-wrap gap-2 items-center mb-4 px-1">
            <span className="text-sm font-medium text-muted-foreground">Searching for: "{filters.searchTerm}"</span>
            <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => dispatch({ type: "CLEAR_FILTERS" })}>
                Clear All
            </Button>
        </div>
     );
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
      {/* Show Clear All if there's any pill OR if there's a search term but no other pills */}
      {(activePills.length > 0 || filters.searchTerm) && (
        <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => dispatch({ type: "CLEAR_FILTERS" })}>
          Clear All
        </Button>
      )}
    </div>
  );
}
