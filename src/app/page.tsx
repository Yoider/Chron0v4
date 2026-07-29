"use client";

import React, { useState } from "react";
import { useProject, Project, Goal, Task, Document, TraceLog } from "@/context/ProjectContext";
import { useSession, signOut } from "next-auth/react";
import FinancesPanel from "@/components/FinancesPanel";

export default function Home() {
  const { data: session } = useSession();
  const [activeView, setActiveView] = useState<"workspace" | "finances">("workspace");
  const {
    projects,
    activeProject,
    activeProjectId,
    loading,
    loadingActiveProject,
    selectProject,
    createProject,
    deleteProject,
    updateProject,
    fetchActiveProject,
  } = useProject();

  // Tabs for Central Panel
  const [activeTab, setActiveTab] = useState<"tracelog" | "docs" | "goals">("tracelog");

  // Project Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // TraceLog form state
  const [lastState, setLastState] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [submittingTrace, setSubmittingTrace] = useState(false);

  // Document Editing state
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<"EXPLANATION" | "REFERENCE" | "GUIDE">("GUIDE");
  const [docContent, setDocContent] = useState("");
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);

  // Goal & Task form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedGoalForTask, setSelectedGoalForTask] = useState<string>("");

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const res = await createProject(newProjectName, newProjectDesc);
    if (res) {
      setNewProjectName("");
      setNewProjectDesc("");
      setShowCreateModal(false);
    }
  };

  // Handle TraceLog Submission
  const handleAddTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !lastState.trim() || !nextSteps.trim()) return;
    setSubmittingTrace(true);
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/tracelog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastState, nextSteps }),
      });
      if (res.ok) {
        setLastState("");
        setNextSteps("");
        await fetchActiveProject(activeProjectId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingTrace(false);
    }
  };

  // Handle Document Save/Update
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !docTitle.trim()) return;
    setSavingDoc(true);
    try {
      const method = selectedDoc ? "PUT" : "POST";
      const url = selectedDoc
        ? `/api/projects/${activeProjectId}/documents/${selectedDoc.id}`
        : `/api/projects/${activeProjectId}/documents`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: docTitle, type: docType, content: docContent }),
      });

      if (res.ok) {
        setIsEditingDoc(false);
        setSelectedDoc(null);
        setDocTitle("");
        setDocContent("");
        await fetchActiveProject(activeProjectId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingDoc(false);
    }
  };

  // Handle Goal Submission
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !goalTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: goalTitle, description: goalDesc }),
      });
      if (res.ok) {
        setGoalTitle("");
        setGoalDesc("");
        setShowGoalForm(false);
        await fetchActiveProject(activeProjectId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Task Submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !taskTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          goalId: selectedGoalForTask || null,
          status: "PENDING",
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        setSelectedGoalForTask("");
        await fetchActiveProject(activeProjectId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (task: Task) => {
    const statuses: Array<Task["status"]> = ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETED"];
    const nextIdx = (statuses.indexOf(task.status) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    try {
      const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchActiveProject(task.projectId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este documento?")) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedDoc?.id === docId) {
          setIsEditingDoc(false);
          setSelectedDoc(null);
        }
        await fetchActiveProject(activeProjectId!);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta meta? (Se desvincularán las tareas asociadas)")) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/goals/${goalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchActiveProject(activeProjectId!);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchActiveProject(task.projectId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Form helpers
  const startNewDoc = () => {
    setSelectedDoc(null);
    setDocTitle("");
    setDocType("GUIDE");
    setDocContent("");
    setIsEditingDoc(true);
  };

  const startEditDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setDocTitle(doc.title);
    setDocType(doc.type);
    setDocContent(doc.content);
    setIsEditingDoc(true);
  };

  // Latest TraceLog for Context Panel
  const latestTrace = activeProject?.traceLogs && activeProject.traceLogs.length > 0
    ? activeProject.traceLogs[0]
    : null;

  return (
    <div className="flex flex-1 flex-row h-screen overflow-hidden bg-[#070913] text-[#c5c6c7]">
      
      {/* COLUMN 1: LEFT SIDEBAR (Sidebar-bg, projects list, navigation) */}
      <aside className="w-80 flex flex-col border-r border-[#252a52] bg-[#0d1124] shrink-0 h-full overflow-hidden">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-[#252a52] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-wider text-[#a78bfa]">🌌 CHRON0V4</span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="px-4 pt-4 flex gap-2">
          <button
            onClick={() => setActiveView("workspace")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
              activeView === "workspace"
                ? "bg-[#a78bfa] text-[#070913] border-[#a78bfa]"
                : "bg-transparent border-[#252a52] text-[#7c8ba1] hover:text-white"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveView("finances")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
              activeView === "finances"
                ? "bg-[#a78bfa] text-[#070913] border-[#a78bfa]"
                : "bg-transparent border-[#252a52] text-[#7c8ba1] hover:text-white"
            }`}
          >
            Finanzas
          </button>
        </div>

        {activeView === "workspace" ? (
          <>
            {/* Search / Project actions */}
            <div className="p-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#151932] hover:bg-[#252a52] border border-[#252a52] rounded-lg text-sm font-semibold text-[#a78bfa] transition-all hover:shadow-[0_0_15px_rgba(102,252,241,0.2)]"
              >
                <span>+</span> Nuevo Proyecto
              </button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              <h3 className="px-3 text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">
                Proyectos Activos
              </h3>
              {loading ? (
                <div className="px-3 text-sm text-[#7c8ba1]">Cargando proyectos...</div>
              ) : projects.length === 0 ? (
                <div className="px-3 text-sm text-[#7c8ba1] italic">Sin proyectos creados.</div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProject(p.id);
                      setIsEditingDoc(false);
                      setSelectedDoc(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col gap-1 border ${
                      activeProjectId === p.id
                        ? "bg-[#151932] text-[#a78bfa] border-[#a78bfa]/30 shadow-[0_0_10px_rgba(102,252,241,0.05)]"
                        : "text-[#c5c6c7] border-transparent hover:bg-[#151932]/50 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold truncate">{p.name}</span>
                    {p.description && (
                      <span className="text-xs text-[#7c8ba1] truncate font-normal">
                        {p.description}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-[#7c8ba1] leading-relaxed">
            <p className="font-bold text-white">💰 Control de Finanzas</p>
            <p>Registra ingresos y egresos para mantener un conteo exacto de tu flujo de caja.</p>
            <p>Opcionalmente, asocia transacciones a proyectos para evaluar la rentabilidad individual de tus desarrollos.</p>
          </div>
        )}

        {/* Footer info & session */}
        <div className="p-4 border-t border-[#252a52] bg-[#090c1a] flex flex-col gap-3 text-xs text-[#7c8ba1]">
          <div className="flex items-center justify-between min-w-0 gap-2 bg-[#151932]/60 p-2.5 rounded-xl border border-[#252a52]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">👤</span>
              <span className="font-bold text-white truncate text-xs" title={session?.user?.name || session?.user?.email || "Usuario"}>
                {session?.user?.name || session?.user?.email || "Usuario"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Cerrar sesión"
              className="p-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-transparent text-red-400 hover:text-[#070913] rounded-lg transition-all flex items-center justify-center shrink-0"
            >
              <span className="text-xs">🚪</span>
            </button>
          </div>
          <div className="flex justify-between text-[10px] px-1 text-[#4e5875]">
            <span>v4.0.0-MVP</span>
            <span className="text-[#a78bfa]/70">Multiusuario</span>
          </div>
        </div>
      </aside>

      {activeView === "workspace" ? (
        <>
          {/* COLUMN 2: CENTRAL WORKSPACE */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#070913]">
        {activeProject ? (
          <>
            {/* Top Workspace Header / Tabs */}
            <div className="px-8 py-6 border-b border-[#252a52] flex items-center justify-between bg-[#0d1124]/40">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{activeProject.name}</h1>
                <p className="text-sm text-[#7c8ba1] mt-1">{activeProject.description || "Sin descripción"}</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-[#0d1124] p-1 rounded-lg border border-[#252a52]">
                <button
                  onClick={() => setActiveTab("tracelog")}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "tracelog"
                      ? "bg-[#151932] text-[#a78bfa]"
                      : "text-[#7c8ba1] hover:text-white"
                  }`}
                >
                  TraceLog
                </button>
                <button
                  onClick={() => setActiveTab("docs")}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "docs"
                      ? "bg-[#151932] text-[#a78bfa]"
                      : "text-[#7c8ba1] hover:text-white"
                  }`}
                >
                  Documentación
                </button>
                <button
                  onClick={() => setActiveTab("goals")}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "goals"
                      ? "bg-[#151932] text-[#a78bfa]"
                      : "text-[#7c8ba1] hover:text-white"
                  }`}
                >
                  Metas y Tareas
                </button>
              </div>
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {loadingActiveProject ? (
                <div className="text-center py-12 text-[#7c8ba1]">Cargando detalles del proyecto...</div>
              ) : (
                <>
                  {/* TAB 1: TRACELOG PANEL */}
                  {activeTab === "tracelog" && (
                    <div className="space-y-8 max-w-4xl">
                      {/* Log session closure form */}
                      <div className="p-6 bg-[#151932] border border-[#252a52] rounded-xl">
                        <h2 className="text-lg font-bold text-white mb-4">Guardar estado de sesión (Cerrar hoy)</h2>
                        <form onSubmit={handleAddTrace} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">
                              ¿Dónde me quedé hoy? (Estado actual)
                            </label>
                            <textarea
                              value={lastState}
                              onChange={(e) => setLastState(e.target.value)}
                              rows={2}
                              required
                              placeholder="Ej: Completada la migración de base de datos y la api inicial de proyectos."
                              className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">
                              ¿Qué es lo siguiente por hacer? (Próximos pasos)
                            </label>
                            <textarea
                              value={nextSteps}
                              onChange={(e) => setNextSteps(e.target.value)}
                              rows={2}
                              required
                              placeholder="Ej: Configurar las vistas frontend de Proyectos y enlazar con la API de CRUD."
                              className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submittingTrace}
                            className="px-6 py-2.5 bg-[#a78bfa] text-[#070913] rounded-lg text-sm font-bold hover:bg-[#c084fc] transition-all"
                          >
                            {submittingTrace ? "Registrando..." : "Registrar TraceLog"}
                          </button>
                        </form>
                      </div>

                      {/* TraceLog Timeline History */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-bold text-white">Historial de Bitácora</h2>
                        {activeProject.traceLogs && activeProject.traceLogs.length > 0 ? (
                          <div className="relative border-l-2 border-[#252a52] pl-6 ml-3 space-y-6">
                            {activeProject.traceLogs.map((log) => (
                              <div key={log.id} className="relative">
                                {/* Dot indicator */}
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#252a52] border-2 border-[#070913] flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"></div>
                                </div>
                                <div className="p-5 bg-[#0d1124]/40 border border-[#252a52] rounded-lg space-y-3">
                                  <div className="flex justify-between items-center text-xs text-[#7c8ba1]">
                                    <span>{new Date(log.createdAt).toLocaleString("es-ES")}</span>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-[#7c8ba1] uppercase tracking-wider mb-1">
                                      Último Estado
                                    </h4>
                                    <p className="text-sm text-white">{log.lastState}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-[#7c8ba1] uppercase tracking-wider mb-1">
                                      Siguiente paso
                                    </h4>
                                    <p className="text-sm text-[#a78bfa]">{log.nextSteps}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#7c8ba1] italic">Ninguna bitácora registrada aún.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DOCUMENTATION PANEL */}
                  {activeTab === "docs" && (
                    <div className="grid grid-cols-3 gap-8">
                      {/* Docs list column (1/3 width) */}
                      <div className="col-span-1 space-y-4">
                        <div className="flex justify-between items-center">
                          <h2 className="text-lg font-bold text-white">Documentos</h2>
                          <button
                            onClick={startNewDoc}
                            className="text-xs py-1 px-3 bg-[#151932] hover:bg-[#252a52] border border-[#252a52] text-[#a78bfa] rounded font-bold transition-all"
                          >
                            + Crear
                          </button>
                        </div>

                        <div className="space-y-2">
                          {activeProject.documents && activeProject.documents.length > 0 ? (
                            activeProject.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 group ${
                                  selectedDoc?.id === doc.id
                                    ? "bg-[#151932] border-[#a78bfa]/30 text-white"
                                    : "bg-[#0d1124]/40 border-[#252a52] hover:bg-[#151932]/40"
                                }`}
                                onClick={() => startEditDoc(doc)}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-sm truncate block max-w-[150px]">
                                    {doc.title}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#070913] text-[#a78bfa] tracking-wider uppercase">
                                    {doc.type}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                  <span className="text-[10px] text-[#7c8ba1]">
                                    {new Date(doc.updatedAt).toLocaleDateString("es-ES")}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDoc(doc.id);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[#7c8ba1] italic">Sin documentos redactados.</p>
                          )}
                        </div>
                      </div>

                      {/* Doc editor/viewer column (2/3 width) */}
                      <div className="col-span-2">
                        {isEditingDoc ? (
                          <div className="p-6 bg-[#151932] border border-[#252a52] rounded-xl space-y-4">
                            <h3 className="text-md font-bold text-white">
                              {selectedDoc ? "Editar Documento" : "Crear Nuevo Documento"}
                            </h3>
                            <form onSubmit={handleSaveDoc} className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                  <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Título</label>
                                  <input
                                    type="text"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    required
                                    placeholder="Ej: Decisiones de Diseño API"
                                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Categoría (Diátaxis)</label>
                                  <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value as any)}
                                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                                  >
                                    <option value="EXPLANATION">Explanations (Teoría)</option>
                                    <option value="REFERENCE">References (Datos)</option>
                                    <option value="GUIDE">Guides (Procesos)</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Contenido (Markdown)</label>
                                <textarea
                                  value={docContent}
                                  onChange={(e) => setDocContent(e.target.value)}
                                  rows={12}
                                  required
                                  placeholder="# Título del Documento&#10;&#10;Detalla el contenido utilizando Markdown para estructurar la información..."
                                  className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#a78bfa]"
                                />
                              </div>

                              <div className="flex gap-3 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditingDoc(false);
                                    setSelectedDoc(null);
                                  }}
                                  className="px-4 py-2 bg-transparent text-[#7c8ba1] hover:text-white text-sm font-semibold transition-all"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  disabled={savingDoc}
                                  className="px-6 py-2 bg-[#a78bfa] text-[#070913] rounded-lg text-sm font-bold hover:bg-[#c084fc] transition-all"
                                >
                                  {savingDoc ? "Guardando..." : "Guardar Documento"}
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : selectedDoc ? (
                          <div className="p-6 bg-[#0d1124]/20 border border-[#252a52] rounded-xl space-y-4">
                            <div className="flex justify-between items-center border-b border-[#252a52] pb-4">
                              <div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#151932] text-[#a78bfa] mr-2">
                                  {selectedDoc.type}
                                </span>
                                <h3 className="text-xl font-bold text-white inline-block">{selectedDoc.title}</h3>
                              </div>
                              <button
                                onClick={() => startEditDoc(selectedDoc)}
                                className="text-xs text-[#a78bfa] hover:underline"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[#c5c6c7]">
                              {selectedDoc.content.split("\n").map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-24 bg-[#0d1124]/10 border border-dashed border-[#252a52] rounded-xl text-[#7c8ba1] italic text-sm">
                            Selecciona un documento para leer o edítalo.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: GOALS & TASKS PANEL */}
                  {activeTab === "goals" && (
                    <div className="space-y-8">
                      {/* Action buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowGoalForm(!showGoalForm)}
                          className="px-4 py-2 bg-[#151932] border border-[#252a52] hover:border-[#a78bfa] rounded-lg text-xs font-semibold text-[#a78bfa] transition-all"
                        >
                          {showGoalForm ? "Cerrar Formulario de Metas" : "+ Añadir Meta (Hito)"}
                        </button>
                      </div>

                      {/* Goal creation form */}
                      {showGoalForm && (
                        <div className="p-6 bg-[#151932] border border-[#252a52] rounded-xl max-w-lg">
                          <h3 className="text-sm font-bold text-white mb-4">Nueva Meta / Hito</h3>
                          <form onSubmit={handleAddGoal} className="space-y-4">
                            <div>
                              <label className="block text-xs text-[#7c8ba1] mb-2 uppercase">Título de la Meta</label>
                              <input
                                type="text"
                                value={goalTitle}
                                onChange={(e) => setGoalTitle(e.target.value)}
                                required
                                placeholder="Ej: Completar API de transacciones"
                                className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#7c8ba1] mb-2 uppercase">Descripción (Opcional)</label>
                              <input
                                type="text"
                                value={goalDesc}
                                onChange={(e) => setGoalDesc(e.target.value)}
                                placeholder="Ej: Integrar pasarela de pagos y endpoints de cobros."
                                className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                              />
                            </div>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#a78bfa] text-[#070913] rounded-lg text-xs font-bold hover:bg-[#c084fc] transition-all"
                            >
                              Crear Meta
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Layout for Goals & Tasks */}
                      <div className="grid grid-cols-2 gap-8">
                        {/* Goals list */}
                        <div className="space-y-4">
                          <h3 className="text-md font-bold text-white">Objetivos & Hitos</h3>
                          {activeProject.goals && activeProject.goals.length > 0 ? (
                            activeProject.goals.map((g) => {
                              // Calculate local progress dynamically based on tasks in context if database progress is default
                              const associatedTasks = activeProject.tasks?.filter((t) => t.goalId === g.id) || [];
                              const completed = associatedTasks.filter((t) => t.status === "COMPLETED").length;
                              const progress = associatedTasks.length > 0
                                ? Math.round((completed / associatedTasks.length) * 100)
                                : 0;

                              return (
                                <div key={g.id} className="p-5 bg-[#0d1124]/40 border border-[#252a52] rounded-lg space-y-4 relative group">
                                  <button
                                    onClick={() => handleDeleteGoal(g.id)}
                                    className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Eliminar
                                  </button>
                                  <div>
                                    <h4 className="font-bold text-sm text-white">{g.title}</h4>
                                    {g.description && <p className="text-xs text-[#7c8ba1] mt-1">{g.description}</p>}
                                  </div>

                                  {/* Progress bar */}
                                  <div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                      <span className="text-[#7c8ba1]">Progreso</span>
                                      <span className="text-[#a78bfa] font-semibold">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-[#0d1124] h-2 rounded-full overflow-hidden border border-[#252a52]">
                                      <div
                                        className="bg-[#a78bfa] h-full rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-[#7c8ba1] italic">Sin objetivos definidos.</p>
                          )}
                        </div>

                        {/* Atomic Tasks (To-Dos) */}
                        <div className="space-y-4">
                          <h3 className="text-md font-bold text-white">Tareas Atómicas (To-Dos)</h3>

                          {/* Quick Task Creation */}
                          <form onSubmit={handleAddTask} className="flex gap-2 p-3 bg-[#0d1124]/30 border border-[#252a52] rounded-lg">
                            <input
                              type="text"
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              required
                              placeholder="Nueva tarea rápida..."
                              className="flex-1 bg-transparent text-sm focus:outline-none focus:placeholder-transparent text-white"
                            />
                            {activeProject.goals && activeProject.goals.length > 0 && (
                              <select
                                value={selectedGoalForTask}
                                onChange={(e) => setSelectedGoalForTask(e.target.value)}
                                className="bg-[#0d1124] border border-[#252a52] text-xs text-[#7c8ba1] rounded px-2 focus:outline-none"
                              >
                                <option value="">Sin Meta</option>
                                {activeProject.goals.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.title.slice(0, 15)}...
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              type="submit"
                              className="py-1 px-3 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-xs font-bold rounded"
                            >
                              Agregar
                            </button>
                          </form>

                          {/* Tasks list */}
                          <div className="space-y-2">
                            {activeProject.tasks && activeProject.tasks.length > 0 ? (
                              activeProject.tasks.map((task) => {
                                const parentGoal = activeProject.goals?.find((g) => g.id === task.goalId);
                                return (
                                  <div
                                    key={task.id}
                                    className="p-3 bg-[#0d1124]/40 border border-[#252a52] hover:border-gray-700 rounded-lg flex items-center justify-between group transition-all"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Status Interactive Badge */}
                                      <button
                                        onClick={() => handleToggleTaskStatus(task)}
                                        className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-md border min-w-[90px] text-center transition-all ${
                                          task.status === "COMPLETED"
                                            ? "bg-[#a78bfa]/10 border-[#a78bfa]/30 text-[#a78bfa]"
                                            : task.status === "IN_PROGRESS"
                                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                                            : task.status === "BLOCKED"
                                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                                            : "bg-[#151932] border-[#252a52] text-[#7c8ba1]"
                                        }`}
                                      >
                                        {task.status === "PENDING"
                                          ? "Pendiente"
                                          : task.status === "IN_PROGRESS"
                                          ? "Progeso"
                                          : task.status === "BLOCKED"
                                          ? "Bloqueado"
                                          : "Completo"}
                                      </button>
                                      <div className="truncate min-w-0">
                                        <p className={`text-sm truncate ${task.status === "COMPLETED" ? "line-through text-[#7c8ba1]" : "text-white"}`}>
                                          {task.title}
                                        </p>
                                        {parentGoal && (
                                          <p className="text-[10px] text-[#7c8ba1] truncate mt-0.5">
                                            Meta: {parentGoal.title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteTask(task)}
                                      className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm text-[#7c8ba1] italic">Sin tareas agregadas.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-[#0d1124]/10 to-[#070913]">
            <span className="text-5xl mb-4">🌌</span>
            <h2 className="text-xl font-bold text-white mb-2">Bienvenido a CHRON0V4</h2>
            <p className="text-sm text-[#7c8ba1] max-w-sm">
              Selecciona un proyecto de la barra lateral o crea uno nuevo para empezar a registrar el contexto de tus desarrollos.
            </p>
          </div>
        )}
      </main>

      {/* COLUMN 3: RIGHT PANEL (Context summary, quick statistics) */}
      <aside className="w-80 border-l border-[#252a52] bg-[#0d1124]/50 flex flex-col p-6 space-y-6 shrink-0 h-full overflow-hidden">
        <div>
          <h3 className="text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-3">
            Contexto del Proyecto
          </h3>
          {activeProject ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#151932] border border-[#252a52] rounded-lg">
                <span className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider">
                  Proyecto Activo
                </span>
                <h4 className="font-bold text-white text-md mt-1 truncate">{activeProject.name}</h4>
                <p className="text-xs text-[#7c8ba1] mt-2">
                  Creado: {new Date(activeProject.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>

              {/* Latest TraceLog view (Context preservation) */}
              <div className="p-4 bg-[#0d1124] border border-[#252a52] rounded-lg space-y-3">
                <span className="text-[10px] font-bold text-[#7c8ba1] uppercase tracking-wider">
                  Último Estado Guardado
                </span>
                {latestTrace ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-[#7c8ba1]">¿Dónde lo dejé?</p>
                      <p className="text-xs text-white line-clamp-3">{latestTrace.lastState}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7c8ba1]">Próximo paso:</p>
                      <p className="text-xs text-[#a78bfa] line-clamp-3">{latestTrace.nextSteps}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#7c8ba1] italic">Ningún estado guardado todavía.</p>
                )}
              </div>

              {/* Overview progress */}
              <div className="p-4 bg-[#0d1124] border border-[#252a52] rounded-lg">
                <span className="text-[10px] font-bold text-[#7c8ba1] uppercase tracking-wider block mb-2">
                  Resumen de Tareas
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span>Pendientes:</span>
                  <span className="font-semibold text-white">
                    {activeProject.tasks?.filter((t) => t.status !== "COMPLETED").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span>Completadas:</span>
                  <span className="font-semibold text-[#a78bfa]">
                    {activeProject.tasks?.filter((t) => t.status === "COMPLETED").length || 0}
                  </span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-[#252a52]">
                <button
                  onClick={() => {
                    if (confirm(`¿Seguro que deseas eliminar el proyecto "${activeProject.name}"? Esta acción no se puede deshacer.`)) {
                      deleteProject(activeProject.id);
                    }
                  }}
                  className="w-full text-left py-2 px-3 hover:bg-red-950/20 text-red-500 hover:text-red-400 text-xs font-semibold rounded border border-transparent hover:border-red-900/30 transition-all"
                >
                  Eliminar Proyecto
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#7c8ba1] italic">Sin proyecto activo.</p>
          )}
        </div>
      </aside>
    </>
  ) : (
    <FinancesPanel />
  )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-[#151932] border border-[#252a52] rounded-xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Nuevo Proyecto</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#7c8ba1] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                  placeholder="Ej: Reingeniería Backend"
                  className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Descripción</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  placeholder="Descripción rápida de la meta del proyecto..."
                  className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-transparent text-[#7c8ba1] hover:text-white text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#a78bfa] text-[#070913] rounded-lg text-sm font-bold hover:bg-[#c084fc] transition-all"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
