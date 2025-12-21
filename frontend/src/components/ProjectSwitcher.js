import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MenuItem, TextField } from "@mui/material";
const ProjectSwitcher = ({ projects, value, onChange, disabled }) => {
    if (!projects.length) {
        return null;
    }
    return (_jsxs(TextField, { select: true, label: "Proyecto activo", size: "small", value: value ?? "", onChange: (event) => onChange(event.target.value), sx: { minWidth: 220 }, disabled: disabled, children: [_jsx(MenuItem, { value: "", disabled: true, children: "Selecciona proyecto" }), projects.map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id)))] }));
};
export default ProjectSwitcher;
