import React, {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useState,
} from 'react';

interface AppContextType {
    developerMode: boolean;
    setDeveloperMode: Dispatch<SetStateAction<boolean>>;
    maxTabs: number;
    setMaxTabs: Dispatch<SetStateAction<number>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [developerMode, setDeveloperMode] = useState<boolean>(false);
    const [maxTabs, setMaxTabs] = useState<number>(5);

    const value = { developerMode, setDeveloperMode, maxTabs, setMaxTabs };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
