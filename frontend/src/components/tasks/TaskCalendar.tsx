import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box } from "@mui/material";
import dayjs from "dayjs";

import { Task } from "../../hooks/useTasks";

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
}

const TaskCalendar = ({ tasks, onSelectTask }: TaskCalendarProps) => {
  const events = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    start: task.start_date,
    end: dayjs(task.end_date).add(1, "day").format("YYYY-MM-DD"),
    color:
      task.status === "done"
        ? "#22c55e"
        : task.status === "doing"
        ? "#0ea5e9"
        : task.status === "blocked"
        ? "#f97316"
        : "#64748b",
  }));

  return (
    <Box sx={{ mt: 2 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height={650}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          onSelectTask(info.event.id);
        }}
      />
    </Box>
  );
};

export default TaskCalendar;
