interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  return (
    <div>
      <div className="flex gap-1 border-b-3 border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-neo border-3 border-b-0
              transition-all duration-150
              ${
                activeTab === tab.id
                  ? "bg-surface border-border text-foreground -mb-[3px]"
                  : "bg-background border-transparent text-muted hover:text-foreground"
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
