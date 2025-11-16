import { CSS } from "@dnd-kit/utilities";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { Box, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import { ReactNode } from "react";

import { Task } from "../../hooks/useTasks";

export const STATUS_META: Record<
  string,
  { label: string; color: "default" | "primary" | "error" | "success" }
> = {
  todo: { label: "Por iniciar", color: "default" },
  doing: { label: "En curso", color: "primary" },
  blocked: { label: "Bloqueada", color: "error" },
  done: { label: "Completada", color: "success" },
};

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
}

const KanbanColumn = ({ status, children }: { status: string; children: ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 500,
        position: "relative",
        border: "1px solid",
        borderColor: isOver ? "primary.main" : "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        boxShadow: isOver ? 6 : "none",
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
};

const KanbanTaskCard = ({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        boxShadow: "0 12px 20px rgba(0,0,0,0.25)",
        opacity: 0.95,
        zIndex: 1400,
      }
    : undefined;
  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.default",
        p: 2,
        mb: 2,
        cursor: "grab",
        position: "relative",
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 1200 : 10,
        backgroundClip: "padding-box",
        touchAction: "none",
        ...style,
      }}
    >
      <Stack spacing={1}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {task.title}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(task)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {dayjs(task.start_date).format("DD/MM/YY")} → {dayjs(task.end_date).format("DD/MM/YY")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Responsable: {task.assignee || "Sin asignar"}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={task.progress}
          color={task.status === "done" ? "success" : "primary"}
        />
      </Stack>
    </Box>
  );
};

const TaskBoard = ({ tasks, onEdit, onDelete, onStatusChange }: TaskBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const task = event.active.data.current as Task | undefined;
    if (!task || !event.over) return;
    const targetStatus = event.over.id as string;
    if (task.status !== targetStatus) {
      onStatusChange(task, targetStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        {Object.entries(STATUS_META).map(([status, meta]) => (
          <KanbanColumn status={status} key={status}>
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                p: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography variant="subtitle1">{meta.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(tasks ?? []).filter((task) => task.status === status).length} tareas
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflowY: "auto", position: "relative", zIndex: 5 }}>
              {(tasks ?? [])
                .filter((task) => task.status === status)
                .map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
            </Box>
          </KanbanColumn>
        ))}
      </Box>
    </DndContext>
  );
};

export default TaskBoard;
