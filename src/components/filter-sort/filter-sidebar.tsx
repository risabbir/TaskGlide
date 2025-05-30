
"use client";

import { useKanban } from "@/lib/store";
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_COLUMNS, PRIORITIES, PRIORITY_STYLES } from "@/lib/constants";
import type { Priority, SortCriteria, SortDirection } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function FilterSidebar() {
  const { state, dispatch } = useKanban();
  const { filters, sort } = state;

  const handleStatusChange = (columnId: string, checked: boolean) => {
    const currentStatusFilters = filters.status || [];
    let newStatusFilters;
    if (checked) {
      newStatusFilters = [...currentStatusFilters, columnId];
    } else {
      newStatusFilters = currentStatusFilters.filter(id => id !== columnId);
    }
    dispatch({ type: "SET_FILTERS", payload: { status: newStatusFilters.length > 0 ? newStatusFilters : DEFAULT_COLUMNS.map(c => c.id) } });
  };
  
  const handleSelectAllStatuses = (checked: boolean) => {
    const allColumnIds = DEFAULT_COLUMNS.map(col => col.id);
    dispatch({ type: "SET_FILTERS", payload: { status: checked ? allColumnIds : DEFAULT_COLUMNS.map(c => c.id) } });
  };

  const handlePriorityChange = (priority?: Priority) => {
    dispatch({ type: "SET_FILTERS", payload: { priority } });
  };

  const handlePredefinedDueDateChange = (dueDateValue?: "overdue" | "today" | "thisWeek" | "none") => {
    dispatch({ type: "SET_FILTERS", payload: { dueDate: dueDateValue, dueDateStart: undefined, dueDateEnd: undefined } });
  };

  const handleSpecificDateChange = (field: "dueDateStart" | "dueDateEnd", date?: Date) => {
    dispatch({ type: "SET_FILTERS", payload: { [field]: date, dueDate: undefined } });
  };

  const handleSortChange = (criteria: SortCriteria, direction: SortDirection) => {
    dispatch({ type: "SET_SORT", payload: { criteria, direction } });
  };

  const handleClearFilters = () => {
    dispatch({ type: "CLEAR_FILTERS" });
  };

  const areAllStatusesSelected = (filters.status || []).length === DEFAULT_COLUMNS.length;

  return (
    <>
      <SheetHeader className="p-6 pb-4 border-b">
        <SheetTitle>Filters & Sort</SheetTitle>
        <SheetDescription>
          Refine your view of tasks on the board.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-grow">
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <Label className="text-base font-semibold">Status (Columns)</Label>
            <div className="mt-1.5 flex items-center space-x-2">
              <Checkbox
                  id="select-all-statuses"
                  checked={areAllStatusesSelected}
                  onCheckedChange={(checked) => handleSelectAllStatuses(checked as boolean)}
              />
              <Label htmlFor="select-all-statuses" className="font-normal">
                  Select All
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DEFAULT_COLUMNS.map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${column.id}`}
                    checked={(filters.status || []).includes(column.id)}
                    onCheckedChange={(checked) => handleStatusChange(column.id, checked as boolean)}
                  />
                  <Label htmlFor={`status-${column.id}`} className="font-normal">
                    {column.title}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Priority Filter */}
          <div>
            <Label className="text-base font-semibold">Priority</Label>
            <RadioGroup
              value={filters.priority || ""} 
              onValueChange={(value) => handlePriorityChange(value === "" ? undefined : value as Priority)}
              className="mt-2 space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="priority-any" />
                <Label htmlFor="priority-any" className="font-normal">Any</Label>
              </div>
              {PRIORITIES.map(p => (
                <div key={p} className="flex items-center space-x-2">
                  <RadioGroupItem value={p} id={`priority-${p}`} />
                  <Label htmlFor={`priority-${p}`} className="font-normal">{PRIORITY_STYLES[p].label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Due Date Filter */}
          <div>
            <Label className="text-base font-semibold">Due Date</Label>
            <RadioGroup
              value={filters.dueDate || ""} 
              onValueChange={(value) => handlePredefinedDueDateChange(value === "" ? undefined : value as any)}
              className="mt-2 space-y-1"
            >
              {[
                { value: undefined, label: "Any (All Dates)" },
                { value: "overdue", label: "Overdue" },
                { value: "today", label: "Due Today" },
                { value: "thisWeek", label: "Due This Week" },
                { value: "none", label: "No Due Date" },
              ].map(opt => (
                <div key={opt.label} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value || ""} id={`dueDate-${opt.value || 'any'}`} />
                  <Label htmlFor={`dueDate-${opt.value || 'any'}`} className="font-normal">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <div className="mt-4 space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Or pick a specific date range:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dueDateStart" className="text-xs">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal h-9", !filters.dueDateStart && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateStart ? format(filters.dueDateStart, "PPP") : <span>Pick start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filters.dueDateStart} onSelect={(date) => handleSpecificDateChange("dueDateStart", date)} initialFocus />
                    </PopoverContent>
                  </Popover>
                   {filters.dueDateStart && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-destructive mt-1" onClick={() => handleSpecificDateChange("dueDateStart", undefined)}>
                        <XCircle className="mr-1 h-3 w-3" /> Clear Start Date
                    </Button>
                  )}
                </div>
                <div>
                  <Label htmlFor="dueDateEnd" className="text-xs">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                       <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal h-9", !filters.dueDateEnd && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateEnd ? format(filters.dueDateEnd, "PPP") : <span>Pick end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filters.dueDateEnd} onSelect={(date) => handleSpecificDateChange("dueDateEnd", date)} initialFocus disabled={(date) => filters.dueDateStart && date < filters.dueDateStart } />
                    </PopoverContent>
                  </Popover>
                   {filters.dueDateEnd && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground hover:text-destructive mt-1" onClick={() => handleSpecificDateChange("dueDateEnd", undefined)}>
                       <XCircle className="mr-1 h-3 w-3" /> Clear End Date
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />

          {/* Sort Options */}
          <div>
            <Label className="text-base font-semibold">Sort By</Label>
            <div className="mt-2 space-y-3">
              {(["creationDate", "dueDate", "priority"] as SortCriteria[]).map(crit => (
                <div key={crit}>
                  <Label className="text-sm capitalize font-medium">
                    {crit.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <RadioGroup
                    value={`${sort.criteria === crit ? crit : ''}-${sort.criteria === crit ? sort.direction : ''}`}
                    onValueChange={(value) => {
                      const [newCrit, newDir] = value.split("-");
                      if (newCrit && newDir) {
                        handleSortChange(newCrit as SortCriteria, newDir as SortDirection);
                      } else if (newCrit) { 
                        handleSortChange(newCrit as SortCriteria, "asc");
                      }
                    }}
                    className="flex gap-4 mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={`${crit}-asc`} id={`sort-${crit}-asc`} />
                      <Label htmlFor={`sort-${crit}-asc`} className="font-normal">
                        {crit === "priority" ? "Low to High" : (crit === "dueDate" ? "Soonest" : "Oldest")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={`${crit}-desc`} id={`sort-${crit}-desc`} />
                      <Label htmlFor={`sort-${crit}-desc`} className="font-normal">
                       {crit === "priority" ? "High to Low" : (crit === "dueDate" ? "Latest" : "Newest")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <SheetFooter className="p-6 border-t">
        <Button variant="outline" onClick={handleClearFilters} className="w-full">
          Clear All Filters & Sort
        </Button>
      </SheetFooter>
    </>
  );
}
