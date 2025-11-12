import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { STATUS_META } from "./TaskBoard";
const TaskGantt = ({ tasks, onSelectTask }) => {
    if (!tasks.length) {
        return (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 2 }, children: "No hay tareas registradas para construir el diagrama de Gantt." }));
    }
    const sorted = [...tasks].sort((a, b) => dayjs(a.start_date).diff(dayjs(b.start_date)));
    const minDate = sorted.reduce((acc, task) => (dayjs(task.start_date).isBefore(acc) ? dayjs(task.start_date) : acc), dayjs(sorted[0].start_date));
    const maxDate = sorted.reduce((acc, task) => (dayjs(task.end_date).isAfter(acc) ? dayjs(task.end_date) : acc), dayjs(sorted[0].end_date));
    const totalDays = Math.max(maxDate.diff(minDate, "day") + 1, 1);
    const dayLabels = Array.from({ length: totalDays }).map((_, index) => minDate.add(index, "day").format("DD/MM"));
    return (_jsxs(Box, { sx: { mt: 3, overflowX: "auto" }, children: [_jsxs(Box, { sx: {
                    display: "grid",
                    gridTemplateColumns: `220px repeat(${totalDays}, minmax(90px, 1fr))`,
                    gap: 0.5,
                    alignItems: "stretch",
                }, children: [_jsx(Box, {}), dayLabels.map((label) => (_jsx(Box, { sx: {
                            textAlign: "center",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            pb: 0.5,
                            fontSize: "0.75rem",
                            color: "text.secondary",
                        }, children: label }, label)))] }), _jsx(Box, { sx: { display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }, children: sorted.map((task) => {
                    const offset = Math.max(dayjs(task.start_date).diff(minDate, "day"), 0);
                    const duration = Math.max(dayjs(task.end_date).diff(dayjs(task.start_date), "day") + 1, 1);
                    const statusMeta = STATUS_META[task.status] ?? STATUS_META.todo;
                    const paletteColor = statusMeta.color === "default" ? "grey.600" : `${statusMeta.color}.main`;
                    const borderColor = statusMeta.color === "default" ? "grey.500" : `${statusMeta.color}.main`;
                    return (_jsxs(Box, { sx: {
                            display: "grid",
                            gridTemplateColumns: `220px repeat(${totalDays}, minmax(90px, 1fr))`,
                            gap: 0.5,
                            cursor: "pointer",
                            "&:hover .gantt-bar": {
                                opacity: 1,
                            },
                        }, onClick: () => onSelectTask(task.id), children: [_jsx(Box, { sx: {
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    display: "flex",
                                    alignItems: "center",
                                    px: 1,
                                    minHeight: 48,
                                    backgroundColor: "background.paper",
                                }, children: _jsxs(Box, { children: [_jsx(Typography, { variant: "body1", fontWeight: 600, children: task.title }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [dayjs(task.start_date).format("DD/MM/YY"), " \u2192 ", dayjs(task.end_date).format("DD/MM/YY")] })] }) }), Array.from({ length: totalDays }).map((_, index) => {
                                const isBar = index >= offset && index < offset + duration;
                                return (_jsx(Box, { sx: {
                                        position: "relative",
                                        height: 48,
                                        backgroundColor: isBar ? paletteColor : "transparent",
                                        border: "1px solid",
                                        borderColor: isBar ? borderColor : "transparent",
                                        borderRadius: isBar ? 1 : 0,
                                        opacity: isBar ? 0.8 : 1,
                                    }, className: isBar ? "gantt-bar" : undefined }, `${task.id}-${index}`));
                            })] }, task.id));
                }) })] }));
};
export default TaskGantt;
