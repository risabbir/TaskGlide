
"use client";

import { useKanban } from "@/lib/store";
import type { Task, Column as ColumnType, FilterState, SortState } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { QuickAddTask } from "./quick-add-task";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ActiveFilterPills } from "@/components/filter-sort/active-filter-pills";
import { isPast, isToday, isThisISOWeek, parseISO } from "date-fns";
import React from "react";

// Helper function to sort tasks
const sortTasks = (tasks: Task[], sortState: SortState): Task[] => {
  const { criteria, direction } = sortState;
  return [...tasks].sort((a, b) => {
    let valA, valB;
    switch (criteria) {
      case "creationDate":
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
      case "dueDate":
        valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (valA === Infinity && valB !== Infinity) return direction === 'asc' ? 1 : -1;
        if (valB === Infinity && valA !== Infinity) return direction === 'asc' ? -1 : 1;
        break;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        valA = priorityOrder[a.priority];
        valB = priorityOrder[b.priority];
        break;
      default:
        return 0;
    }
    return direction === "asc" ? valA - valB : valB - valA;
  });
};

// Helper function to filter tasks
const filterTasks = (tasks: Task[], filters: FilterState): Task[] => {
  return tasks.filter(task => {
    if (filters.status.length > 0 && !filters.status.includes(task.columnId)) {
      // If a column is not selected in filter, visually de-emphasize, but still show if search matches.
      // The actual hiding/showing of columns is handled by what columns are rendered.
      // This filter is more for de-emphasizing if we were to show all columns regardless of filter.
      // For now, we assume columns are filtered out at the board level.
      // However, if search term matches, we should show it.
      if (filters.searchTerm) {
         // continue to other checks if search term exists
      } else {
        return false; // This task's column is not in the selected statuses
      }
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.dueDate) {
      if (!task.dueDate) return filters.dueDate === "none";
      const dueDate = task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate as unknown as string);
      if (filters.dueDate === "overdue" && !(isPast(dueDate) && !isToday(dueDate))) return false;
      if (filters.dueDate === "today" && !isToday(dueDate)) return false;
      if (filters.dueDate === "thisWeek" && !isThisISOWeek(dueDate)) return false;
    }
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const inTitle = task.title.toLowerCase().includes(searchTermLower);
      const inDescription = task.description?.toLowerCase().includes(searchTermLower) || false;
      const inTags = task.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
      if (!(inTitle || inDescription || inTags)) return false;
    }
    return true;
  });
};


export function KanbanBoard() {
  const { state } = useKanban();
  const { tasks, columns, filters, sort } = state;

  const filteredAndSortedTasks = filterTasks(tasks, filters);
  
  // Filter columns based on filter.status
  const visibleColumns = columns.filter(col => filters.status.includes(col.id));


  return (
    <div className="flex flex-col flex-grow p-4 space-y-4 overflow-hidden">
      <QuickAddTask />
      <ActiveFilterPills />
      <ScrollArea className="flex-grow w-full whitespace-nowrap">
        <div className="flex flex-col md:flex-row gap-4 h-full pb-4">
          {visibleColumns.map((column) => {
            const columnTasks = filteredAndSortedTasks.filter((task) => task.columnId === column.id);
            const sortedColumnTasks = sortTasks(columnTasks, sort);
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={sortedColumnTasks}
                allColumns={columns}
              />
            );
          })}
           {visibleColumns.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-8">
              <p className="text-lg">No columns match your current filters.</p>
              <p className="text-sm">Try adjusting your filter settings.</p>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

