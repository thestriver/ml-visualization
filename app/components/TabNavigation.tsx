'use client';

import { Tab } from '../../types';

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (id: string) => void;
}

export default function TabNavigation({ tabs, activeTab, setActiveTab }: TabNavigationProps) {
    return (
        <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}