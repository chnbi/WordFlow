import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  clearCurrentProject: () => set({ currentProject: null })
}));

export const useTranslationStore = create((set) => ({
  translations: [],
  setTranslations: (translations) => set({ translations }),
  addTranslation: (translation) => set((state) => ({
    translations: [...state.translations, translation]
  })),
  updateTranslation: (id, updates) => set((state) => ({
    translations: state.translations.map(t =>
      t._id === id ? { ...t, ...updates } : t
    )
  })),
  removeTranslation: (id) => set((state) => ({
    translations: state.translations.filter(t => t._id !== id)
  })),
  clearTranslations: () => set({ translations: [] })
}));

export const useGlossaryStore = create((set) => ({
  glossary: [],
  setGlossary: (glossary) => set({ glossary }),
  addGlossaryTerm: (term) => set((state) => ({
    glossary: [...state.glossary, term]
  })),
  updateGlossaryTerm: (id, updates) => set((state) => ({
    glossary: state.glossary.map(t =>
      t._id === id ? { ...t, ...updates } : t
    )
  })),
  removeGlossaryTerm: (id) => set((state) => ({
    glossary: state.glossary.filter(t => t._id !== id)
  }))
}));
