"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Task {
  id: string;
  projectId: string;
  goalId: string | null;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  type: "EXPLANATION" | "REFERENCE" | "GUIDE";
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TraceLog {
  id: string;
  projectId: string;
  lastState: string;
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  traceLogs?: TraceLog[];
  documents?: Document[];
  goals?: Goal[];
  tasks?: Task[];
}

interface ProjectContextProps {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  loading: boolean;
  loadingActiveProject: boolean;
  fetchProjects: () => Promise<void>;
  fetchActiveProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  createProject: (name: string, description: string) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  updateProject: (id: string, name: string, description: string) => Promise<Project | null>;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingActiveProject, setLoadingActiveProject] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setProjects(data);
          // Automatically select the first project if none is active
          if (data.length > 0 && !activeProjectId) {
            setActiveProjectId(data[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProject = async (id: string) => {
    try {
      setLoadingActiveProject(true);
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setActiveProject(data);
        }
      }
    } catch (error) {
      console.error(`Error fetching project details for ${id}:`, error);
    } finally {
      setLoadingActiveProject(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      fetchActiveProject(activeProjectId);
    } else {
      setActiveProject(null);
    }
  }, [activeProjectId]);

  const selectProject = (id: string | null) => {
    setActiveProjectId(id);
  };

  const createProject = async (name: string, description: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const newProj = await res.json();
        await fetchProjects();
        setActiveProjectId(newProj.id);
        return newProj;
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
    return null;
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProjects();
        if (activeProjectId === id) {
          setActiveProjectId(projects.length > 1 ? projects[0].id === id ? projects[1].id : projects[0].id : null);
        }
        return true;
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
    return false;
  };

  const updateProject = async (id: string, name: string, description: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchProjects();
        if (activeProjectId === id) {
          await fetchActiveProject(id);
        }
        return updated;
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
    return null;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        loading,
        loadingActiveProject,
        fetchProjects,
        fetchActiveProject,
        selectProject,
        createProject,
        deleteProject,
        updateProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
