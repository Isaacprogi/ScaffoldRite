import  { createContext,  useState, type ReactNode, useEffect } from 'react';
type ViewMode = "graph" | "list";
type DisplayMode = "full" | "filename";

interface AppContextType {

  //view mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Display Mode
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  
  // UI Settings
  showExportBtn: boolean;
  setShowExportBtn: (show: boolean) => void;
  showReloadBtn: boolean;
  setShowReloadBtn: (show: boolean) => void;
  enableTooltips: boolean;
  setEnableTooltips: (enable: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);


const loadFromLocalStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    return JSON.parse(stored);
  }
  return defaultValue;
};

const saveToLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => 
    loadFromLocalStorage('viewMode', 'graph')
  );
  
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => 
    loadFromLocalStorage('displayMode', 'full')
  );
  
  const [showExportBtn, setShowExportBtn] = useState<boolean>(() => 
    loadFromLocalStorage('showExportBtn', true)
  );
  
  const [showReloadBtn, setShowReloadBtn] = useState<boolean>(() => 
    loadFromLocalStorage('showReloadBtn', true)
  );
  
  const [enableTooltips, setEnableTooltips] = useState<boolean>(() => 
    loadFromLocalStorage('enableTooltips', true)
  );


  useEffect(() => {
    saveToLocalStorage('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToLocalStorage('displayMode', displayMode);
  }, [displayMode]);

  useEffect(() => {
    saveToLocalStorage('showExportBtn', showExportBtn);
  }, [showExportBtn]);

  useEffect(() => {
    saveToLocalStorage('showReloadBtn', showReloadBtn);
  }, [showReloadBtn]);

  useEffect(() => {
    saveToLocalStorage('enableTooltips', enableTooltips);
  }, [enableTooltips]);

  const value = {
    viewMode,
    setViewMode,
    displayMode,
    setDisplayMode,
    showExportBtn,
    setShowExportBtn,
    showReloadBtn,
    setShowReloadBtn,
    enableTooltips,
    setEnableTooltips,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
