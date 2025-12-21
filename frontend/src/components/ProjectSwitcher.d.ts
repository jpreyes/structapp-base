import { Project } from "../hooks/useProjects";
type ProjectSwitcherProps = {
    projects: Project[];
    value?: string;
    onChange: (projectId: string) => void;
    disabled?: boolean;
};
declare const ProjectSwitcher: ({ projects, value, onChange, disabled }: ProjectSwitcherProps) => import("react/jsx-runtime").JSX.Element;
export default ProjectSwitcher;
