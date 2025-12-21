import { MenuItem, TextField } from "@mui/material";

import { Project } from "../hooks/useProjects";

type ProjectSwitcherProps = {
  projects: Project[];
  value?: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
};

const ProjectSwitcher = ({ projects, value, onChange, disabled }: ProjectSwitcherProps) => {
  if (!projects.length) {
    return null;
  }

  return (
    <TextField
      select
      label="Proyecto activo"
      size="small"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 220 }}
      disabled={disabled}
    >
      <MenuItem value="" disabled>
        Selecciona proyecto
      </MenuItem>
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default ProjectSwitcher;
