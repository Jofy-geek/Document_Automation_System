import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { v4 as uuidv4 } from 'uuid';

const BRD_TEMPLATE = [
  { title: "Executive Summary" },
  { title: "Business Objectives" },
  { title: "Project Scope" },
  {
    title: "Stakeholders",
    tableData: {
      headers: ['Stakeholder', 'Role', 'Responsibility'],
      rows: [
        ['Project Owner', 'Decision Maker', 'Final approval of deliverables.'],
        ['Business Analyst', 'Requirements Lead', 'Define and validate requirements.'],
        ['Development Team', 'Engineering', 'Build and implement the system.'],
        ['QA Team', 'Testing', 'Ensure quality and validation.'],
        ['End Users', 'Users', 'Create and manage documents.']
      ]
    }
  },
  { title: "Business Requirements" },
  { title: "User Personas" },
  { title: "Functional Requirements" },
  { title: "Non-Functional Requirements" },
  { title: "Document Generation Workflow" },
  { title: "Assumptions" },
  { title: "Constraints" },
  { title: "Risks" },
  { title: "Success Criteria" },
  { title: "Future Enhancements" }
];

const SRS_TEMPLATE = [
  {
    title: "INTRODUCTION",
    children: [
      { title: "PURPOSE" },
      { title: "SCOPE OF THE SYSTEM" },
      {
        title: "DEFINITIONS & ACRONYMS",
        children: [
          { title: "Definitions" },
          { title: "Acronyms & Abbreviations" }
        ]
      },
      { title: "REFERENCES" },
      { title: "DOCUMENT OVERVIEW" }
    ]
  },
  {
    title: "OVERALL DESCRIPTION",
    children: [
      { title: "PRODUCT PERSPECTIVE" },
      { title: "PRODUCT FEATURES" },
      { title: "USER CLASSES & CHARACTERISTICS" },
      { title: "OPERATING ENVIRONMENT" },
      { title: "DESIGN & IMPLEMENTATION CONSTRAINTS" },
      { title: "ASSUMPTIONS & DEPENDENCIES" },
      { title: "FUTURE ENHANCEMENTS" }
    ]
  },
  {
    title: "SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS",
    children: [
      { title: "FUNCTIONAL REQUIREMENTS" },
      {
        title: "NON-FUNCTIONAL REQUIREMENTS",
        children: [
          { title: "Performance" },
          { title: "Availability & Reliability" },
          { title: "Scalability" },
          { title: "Usability & Accessibility" },
          { title: "Security Requirements" }
        ]
      },
      {
        title: "INTERFACE REQUIREMENTS",
        children: [
          { title: "User Interface (UI/UX)" },
          { title: "Hardware Interface" },
          { title: "Software Interface" },
          { title: "Communication Interface" }
        ]
      }
    ]
  },
  {
    title: "SYSTEM MODELS / DESIGN AIDS",
    children: [
      { title: "USE CASE DIAGRAMS" },
      { title: "USE CASE DESCRIPTIONS" },
      { title: "ER DIAGRAM (DATABASE STRUCTURE)" },
      { title: "DATA FLOW DIAGRAMS (DFD) / FLOWCHARTS" },
      { title: "SEQUENCE DIAGRAM" },
      { title: "ARCHITECTURE DIAGRAM (HIGH-LEVEL SYSTEM ARCHITECTURE)" }
    ]
  },
  {
    title: "DATA REQUIREMENTS",
    children: [
      { title: "DATABASE SCHEMA" },
      { title: "DATABASE SCHEMA NOTES" }
    ]
  },
  {
    title: "SYSTEM CONSTRAINTS & STANDARDS",
    children: [
      { title: "REGULATORY COMPLIANCE" },
      { title: "TECHNOLOGY STACK CONSTRAINTS" },
      { title: "CODING STANDARDS" }
    ]
  },
  {
    title: "ACCEPTANCE CRITERIA",
    children: [
      { title: "FUNCTIONAL ACCEPTANCE CRITERIA" },
      { title: "UAT PROCESS & CHECKLIST" },
      { title: "PERFORMANCE BENCHMARKS" }
    ]
  },
  {
    title: "PROJECT SCOPE BOUNDARY",
    children: [
      { title: "In Scope" },
      { title: "Out of Scope" }
    ]
  },
  {
    title: "APPENDICES",
    children: [
      {
        title: "ASSUMPTIONS AND CONSTRAINTS",
        children: [
          { title: "Assumptions" },
          { title: "Constraints" }
        ]
      }
    ]
  },
  { title: "SUMMARY" }
];

const buildTemplate = (template) => {
  return template.map(item => ({
    ...item,
    id: uuidv4(),
    content: item.content || '',
    children: item.children ? buildTemplate(item.children) : []
  }));
};

const updateNode = (nodes, targetId, updateFn) => {
  return nodes.map(node => {
    if (node.id === targetId) return updateFn(node);
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNode(node.children, targetId, updateFn) };
    }
    return node;
  });
};

const deleteNode = (nodes, targetId) => {
  return nodes.filter(n => n.id !== targetId).map(node => {
    if (node.children && node.children.length > 0) {
      return { ...node, children: deleteNode(node.children, targetId) };
    }
    return node;
  });
};

export const useProjectStore = create(
  temporal(
    persist(
      (set, get) => ({
      projects: [],
      addProject: (projectData) => set((state) => ({
        projects: [
          {
             ...projectData,
             id: uuidv4(),
             createdAt: new Date().toISOString(),
             requirements: [], // Used for SRS (Legacy)
             // Used for BRD/SRS: Generate fresh UUIDs for deep clones to prevent collision across projects
             sections: projectData.documentType === 'BRD' 
               ? buildTemplate(BRD_TEMPLATE)
               : projectData.documentType === 'SRS'
                 ? buildTemplate(SRS_TEMPLATE)
                 : []
          },
          ...state.projects
        ]
      })),
      updateProject: (id, projectData) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...projectData } : p)
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      })),
      
      initializeTemplate: (projectId, documentType) => set((state) => ({
        projects: state.projects.map(p => {
          if (p.id !== projectId) return p;
          const sections = documentType === 'BRD' 
            ? buildTemplate(BRD_TEMPLATE) 
            : documentType === 'SRS' ? buildTemplate(SRS_TEMPLATE) : [];
          return { ...p, sections };
        })
      })),
      
      // SRS Requirements Methods
      addRequirement: (projectId, requirement) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          requirements: [...p.requirements, { ...requirement, id: uuidv4() }]
        } : p)
      })),
      updateRequirement: (projectId, reqId, reqData) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          requirements: p.requirements.map(r => r.id === reqId ? { ...r, ...reqData } : r)
        } : p)
      })),
      deleteRequirement: (projectId, reqId) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          requirements: p.requirements.filter(r => r.id !== reqId)
        } : p)
      })),
      reorderRequirements: (projectId, newOrder) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          requirements: newOrder
        } : p)
      })),

      // BRD Recursive Section Architecture
      addSectionNode: (projectId, parentId, newNode) => set((state) => ({
        projects: state.projects.map(p => {
          if (p.id !== projectId) return p;
          if (!parentId) {
             return { ...p, sections: [...(p.sections || []), { ...newNode, id: uuidv4(), content: '', children: [] }] };
          }
          return {
            ...p,
            sections: updateNode(p.sections, parentId, (node) => ({
              ...node,
              children: [...(node.children || []), { ...newNode, id: uuidv4(), content: '', children: [] }]
            }))
          };
        })
      })),
      updateSectionNode: (projectId, targetId, data) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          sections: updateNode(p.sections, targetId, (node) => ({ ...node, ...data }))
        } : p)
      })),
      deleteSectionNode: (projectId, targetId) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          sections: deleteNode(p.sections, targetId)
        } : p)
      })),
      reorderSections: (projectId, newOrder) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? {
          ...p,
          sections: newOrder // Applies only to top level
        } : p)
      }))
    }),
    {
      name: 'document-automation-storage',
    }
  ),
  { limit: 50 } // Keep up to 50 undo operations in memory
  )
);
