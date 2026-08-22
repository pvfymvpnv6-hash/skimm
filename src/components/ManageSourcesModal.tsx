import React, { useState } from "react";
import { 
  X, Plus, Globe, Check, Trash2, Sliders, ToggleLeft, ToggleRight, 
  Layers, Radio 
} from "lucide-react";
import { TopicConfig, SourceConfig } from "../types";

interface ManageSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicConfig[];
  setTopics: (topics: TopicConfig[]) => void;
  sources: SourceConfig[];
  setSources: (sources: SourceConfig[]) => void;
  dismissedCount?: number;
  onResetDismissed?: () => void;
}

export default function ManageSourcesModal({
  isOpen,
  onClose,
  topics,
  setTopics,
  sources,
  setSources,
  dismissedCount = 0,
  onResetDismissed,
}: ManageSourcesModalProps) {
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceDomain, setNewSourceDomain] = useState("");
  const [activeTab, setActiveTab] = useState<"topics" | "sources">("topics");

  if (!isOpen) return null;

  // Toggle active/inactive topic
  const toggleTopic = (id: string) => {
    const updated = topics.map((t) => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    );
    setTopics(updated);
  };

  // Toggle active/inactive source
  const toggleSource = (id: string) => {
    const updated = sources.map((s) => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSources(updated);
  };

  // Change weight / priority of source
  const changeSourceWeight = (id: string, weight: number) => {
    const updated = sources.map((s) => 
      s.id === id ? { ...s, weight } : s
    );
    setSources(updated);
  };

  // Add custom source
  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceDomain.trim()) return;

    // Sanitize domain
    let domain = newSourceDomain.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, ""); // remove protocol and www

    const newSource: SourceConfig = {
      id: `custom-${Date.now()}`,
      name: newSourceName.trim(),
      domain: domain,
      enabled: true,
      isCustom: true,
      weight: 2
    };

    setSources([...sources, newSource]);
    setNewSourceName("");
    setNewSourceDomain("");
  };

  // Delete custom source
  const handleDeleteSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
  };

  return (
    <div 
      id="manage-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div 
        id="manage-modal-content"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 text-lg">
                Themen & Quellen verwalten
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Personalisiere deine Feed-Filter
              </p>
            </div>
          </div>
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 px-4 py-2 bg-slate-50/50 dark:bg-slate-950/20">
          <button
            id="tab-topics"
            onClick={() => setActiveTab("topics")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === "topics"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Themen
          </button>
          <button
            id="tab-sources"
            onClick={() => setActiveTab("sources")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === "sources"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4" />
            Medienquellen
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "topics" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Wähle die Kategorien aus, die du in deinem persönlichen Newsfeed sehen möchtest:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    id={`topic-toggle-${topic.id}`}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      topic.enabled
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-950"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="font-sans font-medium text-sm">{topic.name}</span>
                    <div 
                      className={`w-8 h-4 rounded-full transition-colors relative ${
                        topic.enabled ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    >
                      <div 
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                          topic.enabled ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Custom Source Form */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider mb-3">
                  Eigene Quelle hinzufügen
                </h4>
                <form onSubmit={handleAddCustomSource} className="grid gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      id="source-name-input"
                      type="text"
                      placeholder="Medienquelle (z. B. SPIEGEL Online)"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      className="bg-white dark:bg-slate-900 text-sm font-sans border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                    <input
                      id="source-domain-input"
                      type="text"
                      placeholder="Domain (z. B. spiegel.de)"
                      value={newSourceDomain}
                      onChange={(e) => setNewSourceDomain(e.target.value)}
                      className="bg-white dark:bg-slate-900 text-sm font-sans border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <button
                    id="add-source-btn"
                    type="submit"
                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Hinzufügen
                  </button>
                </form>
              </div>

              {/* Source List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
                  Verfügbare Medienquellen
                </h4>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      id={`source-item-${source.id}`}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {source.name}
                            {source.isCustom && (
                              <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 px-1.5 rounded">
                                Eigene
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {source.domain}
                          </div>

                          {source.enabled && (
                            <div className="flex items-center gap-1 mt-2 bg-slate-50 dark:bg-slate-950 p-0.5 rounded-xl w-fit border border-slate-150 dark:border-slate-800/60">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold px-1.5 uppercase tracking-wider font-mono">
                                Gewichtung:
                              </span>
                              {[
                                { val: 1, label: "Weniger" },
                                { val: 2, label: "Std." },
                                { val: 3, label: "Mehr" }
                              ].map((opt) => {
                                const isSelected = (source.weight ?? 2) === opt.val;
                                return (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => changeSourceWeight(source.id, opt.val)}
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-slate-700/40"
                                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle active state */}
                        <button
                          id={`source-toggle-${source.id}`}
                          onClick={() => toggleSource(source.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            source.enabled
                              ? "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                              : "text-slate-300 hover:text-slate-400 dark:text-slate-700 dark:hover:text-slate-600"
                          }`}
                        >
                          {source.enabled ? (
                            <ToggleRight className="w-7 h-7" />
                          ) : (
                            <ToggleLeft className="w-7 h-7" />
                          )}
                        </button>

                        {/* Delete Custom Source */}
                        {source.isCustom && (
                          <button
                            id={`source-delete-${source.id}`}
                            onClick={() => handleDeleteSource(source.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/20">
          <div>
            {dismissedCount > 0 && onResetDismissed && (
              <button
                id="reset-dismissed-articles-btn"
                onClick={onResetDismissed}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:underline transition-colors cursor-pointer"
              >
                {dismissedCount} ausgeblendete Artikel wieder anzeigen
              </button>
            )}
          </div>
          <button
            id="save-modal-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            Fertigstellen
          </button>
        </div>
      </div>
    </div>
  );
}
