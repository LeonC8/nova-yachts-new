"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import {
  FEATURED_COUNT,
  SITE_CONFIG_PATH,
  SiteConfig,
  normalizeSiteConfig,
  orderCategory,
  LEGACY_NEW_YACHTS_IDS,
  LEGACY_PRE_OWNED_YACHTS_IDS,
} from "@/lib/siteConfig";

interface Boat {
  id: string;
  name: string;
  condition: string;
  year: string;
  price: string;
  mainPhoto?: string;
  basicListing?: string;
  sold?: boolean;
}

interface SiteConfigManagerProps {
  boats: Boat[];
  onClose: () => void;
}

type TabKey = "featuredNew" | "featuredPreOwned" | "orderNew" | "orderPreOwned";

const TABS: { key: TabKey; label: string }[] = [
  { key: "featuredNew", label: "Featured · New" },
  { key: "featuredPreOwned", label: "Featured · Pre-owned" },
  { key: "orderNew", label: "Order · New Page" },
  { key: "orderPreOwned", label: "Order · Pre-owned Page" },
];

export function SiteConfigManager({ boats, onClose }: SiteConfigManagerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("featuredNew");
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Every edit goes through here so we can warn about unsaved changes.
  const updateConfig = (next: SiteConfig) => {
    setConfig(next);
    setIsDirty(true);
    setSaveMessage("");
  };

  const handleClose = () => {
    if (
      isDirty &&
      !window.confirm("You have unsaved changes. Close without saving?")
    )
      return;
    onClose();
  };

  const newBoats = boats.filter((b) => b.condition === "new");
  const preOwnedBoats = boats.filter((b) => b.condition === "pre-owned");

  // Load existing config (with sensible fallbacks) on mount.
  useEffect(() => {
    const load = async () => {
      const database = getDatabase();
      const snap = await get(dbRef(database, SITE_CONFIG_PATH));
      const loaded = normalizeSiteConfig(snap.val());

      // Featured lists fall back to legacy hardcoded IDs the first time.
      if (loaded.featured.new.length === 0)
        loaded.featured.new = LEGACY_NEW_YACHTS_IDS.filter((id) =>
          newBoats.some((b) => b.id === id)
        );
      if (loaded.featured.preOwned.length === 0)
        loaded.featured.preOwned = LEGACY_PRE_OWNED_YACHTS_IDS.filter((id) =>
          preOwnedBoats.some((b) => b.id === id)
        );

      // Order lists start as exactly what the live category page shows
      // today (saved order first, then any boats not yet ordered), so what the
      // admin sees here always matches the site.
      const mergeOrder = (saved: string[], all: Boat[]): string[] =>
        orderCategory(all, saved).map((b) => b.id);
      loaded.order.new = mergeOrder(loaded.order.new, newBoats);
      loaded.order.preOwned = mergeOrder(loaded.order.preOwned, preOwnedBoats);

      setConfig(loaded);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boatById = (id: string) => boats.find((b) => b.id === id);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const database = getDatabase();
      // Only persist IDs that still correspond to real boats.
      const clean: SiteConfig = {
        featured: {
          new: config.featured.new.filter((id) => boatById(id)),
          preOwned: config.featured.preOwned.filter((id) => boatById(id)),
        },
        order: {
          new: config.order.new.filter((id) => boatById(id)),
          preOwned: config.order.preOwned.filter((id) => boatById(id)),
        },
      };
      await set(dbRef(database, SITE_CONFIG_PATH), clean);
      setIsDirty(false);
      setSaveMessage("Saved! Changes are now live on the site.");
    } catch (err) {
      console.error("Error saving site config:", err);
      setSaveMessage("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Featured tab helpers (pick + order) ---
  const isFeaturedTab = activeTab === "featuredNew" || activeTab === "featuredPreOwned";
  const featuredKey: "new" | "preOwned" =
    activeTab === "featuredNew" ? "new" : "preOwned";
  const featuredPool = featuredKey === "new" ? newBoats : preOwnedBoats;
  const featuredSelected = config ? config.featured[featuredKey] : [];

  const toggleFeatured = (id: string) => {
    if (!config) return;
    const current = config.featured[featuredKey];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    updateConfig({
      ...config,
      featured: { ...config.featured, [featuredKey]: next },
    });
  };

  const onFeaturedDragEnd = (result: DropResult) => {
    if (!config || !result.destination) return;
    const items = Array.from(config.featured[featuredKey]);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    updateConfig({
      ...config,
      featured: { ...config.featured, [featuredKey]: items },
    });
  };

  // --- Order tab helpers (reorder all) ---
  const orderKey: "new" | "preOwned" =
    activeTab === "orderNew" ? "new" : "preOwned";
  const orderList = config ? config.order[orderKey] : [];

  const moveInOrder = (from: number, to: number) => {
    if (!config) return;
    const items = Array.from(config.order[orderKey]);
    if (to < 0 || to >= items.length || from === to) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    updateConfig({
      ...config,
      order: { ...config.order, [orderKey]: items },
    });
  };

  const onOrderDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveInOrder(result.source.index, result.destination.index);
  };

  const featuredIdsForOrderTab = config
    ? new Set(config.featured[orderKey].slice(0, FEATURED_COUNT))
    : new Set<string>();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-xl max-w-6xl w-full h-full sm:h-auto sm:max-h-[88vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
              Homepage & Page Order
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="mt-3 sm:mt-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto sm:flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {!config ? (
            <div className="text-center text-gray-500 py-12">Loading…</div>
          ) : isFeaturedTab ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Pick the yachts to feature on the homepage, then drag to set
                their order. The homepage shows the first{" "}
                <strong>{FEATURED_COUNT}</strong> in this list.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pool: pick which to feature */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {featuredKey === "new" ? "New" : "Pre-owned"} Yachts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                    {featuredPool.map((boat) => {
                      const selected = featuredSelected.includes(boat.id);
                      return (
                        <button
                          key={boat.id}
                          type="button"
                          onClick={() => toggleFeatured(boat.id)}
                          className={`text-left border rounded-lg overflow-hidden transition-all ${
                            selected
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="relative h-28 w-full bg-gray-100">
                            {boat.mainPhoto ? (
                              <Image
                                src={boat.mainPhoto}
                                alt={boat.name}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                            {selected && (
                              <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                                ✓
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {boat.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {boat.year} • €
                              {Number(boat.price).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {featuredPool.length === 0 && (
                      <p className="text-sm text-gray-500 col-span-full">
                        No yachts in this category.
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected: order the featured */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Featured Order ({featuredSelected.length})
                  </h3>
                  {featuredSelected.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      Select yachts on the left to feature them.
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onFeaturedDragEnd}>
                      <Droppable droppableId="featured-order">
                        {(provided: DroppableProvided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3 max-h-[55vh] overflow-y-auto pr-2"
                          >
                            {featuredSelected.map((id, index) => {
                              const boat = boatById(id);
                              if (!boat) return null;
                              const beyondLimit = index >= FEATURED_COUNT;
                              return (
                                <Draggable
                                  key={id}
                                  draggableId={id}
                                  index={index}
                                >
                                  {(
                                    p: DraggableProvided,
                                    snap: DraggableStateSnapshot
                                  ) => (
                                    <div
                                      ref={p.innerRef}
                                      {...p.draggableProps}
                                      {...p.dragHandleProps}
                                      className={`flex items-center space-x-3 p-3 bg-white rounded-lg border cursor-move ${
                                        snap.isDragging
                                          ? "border-blue-500 shadow-lg"
                                          : beyondLimit
                                          ? "border-gray-200 opacity-50"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <div className="text-sm font-bold text-gray-500 min-w-[24px]">
                                        {index + 1}
                                      </div>
                                      <div className="relative w-14 h-14 flex-shrink-0">
                                        {boat.mainPhoto ? (
                                          <Image
                                            src={boat.mainPhoto}
                                            alt={boat.name}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            className="rounded-md"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gray-200 rounded-md" />
                                        )}
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                                          {boat.name}
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                          {boat.year} • €
                                          {Number(boat.price).toLocaleString()}
                                        </p>
                                        {beyondLimit && (
                                          <p className="text-[11px] text-amber-600 font-medium">
                                            Not shown (beyond top {FEATURED_COUNT})
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatured(id)}
                                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Order tab: reorder the full category list
            <div className="max-w-3xl">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                This is the exact order yachts appear on the{" "}
                <strong>
                  {orderKey === "new" ? "New Yachts" : "Pre-owned"}
                </strong>{" "}
                page. Drag a row, or use the arrows, then press{" "}
                <strong>Save Changes</strong>.
                <span className="hidden sm:inline">
                  {" "}The rows after the homepage featured yachts are also the
                  ones previewed in the homepage &ldquo;View all&rdquo; button.
                </span>
              </p>
              {/* No inner scroll container here: the modal body is the single
                  scroll parent, which keeps drag auto-scrolling reliable. */}
              <DragDropContext onDragEnd={onOrderDragEnd}>
                <Droppable droppableId="page-order">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {orderList.map((id, index) => {
                        const boat = boatById(id);
                        if (!boat) return null;
                        const isFirst = index === 0;
                        const isLast = index === orderList.length - 1;
                        return (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(
                              p: DraggableProvided,
                              snap: DraggableStateSnapshot
                            ) => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                className={`flex items-center gap-2 sm:gap-3 p-2 bg-white rounded-lg border cursor-move ${
                                  snap.isDragging
                                    ? "border-blue-500 shadow-lg"
                                    : "border-gray-200"
                                } ${boat.sold ? "opacity-60" : ""}`}
                              >
                                <div className="hidden sm:block text-gray-300 select-none px-1" aria-hidden>
                                  ⋮⋮
                                </div>
                                <div className="text-sm font-bold text-gray-500 min-w-[20px] sm:min-w-[24px]">
                                  {index + 1}
                                </div>
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                  {boat.mainPhoto ? (
                                    <Image
                                      src={boat.mainPhoto}
                                      alt={boat.name}
                                      fill
                                      style={{ objectFit: "cover" }}
                                      className="rounded-md"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 rounded-md" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                                    {boat.name}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="text-xs text-gray-600">
                                      {boat.year} • €
                                      {Number(boat.price).toLocaleString()}
                                    </span>
                                    {featuredIdsForOrderTab.has(id) && (
                                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                                        Featured
                                      </span>
                                    )}
                                    {boat.sold && (
                                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5">
                                        Sold
                                      </span>
                                    )}
                                    {boat.basicListing === "yes" && (
                                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
                                        Basic
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {[
                                    { label: "⤒", title: "Move to top", to: 0, disabled: isFirst, desktopOnly: true },
                                    { label: "↑", title: "Move up", to: index - 1, disabled: isFirst, desktopOnly: false },
                                    { label: "↓", title: "Move down", to: index + 1, disabled: isLast, desktopOnly: false },
                                    { label: "⤓", title: "Move to bottom", to: orderList.length - 1, disabled: isLast, desktopOnly: true },
                                  ].map((btn) => (
                                    <button
                                      key={btn.title}
                                      type="button"
                                      title={btn.title}
                                      aria-label={btn.title}
                                      disabled={btn.disabled}
                                      onClick={() => moveInOrder(index, btn.to)}
                                      className={`${btn.desktopOnly ? "hidden sm:flex" : "flex"} items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded border border-gray-200 text-gray-600 text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed`}
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {orderList.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No yachts in this category.
                        </p>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-between items-center gap-3">
          <div className="text-sm text-gray-600">
            {saveMessage ||
              (isDirty && (
                <span className="text-amber-600 font-medium">
                  Unsaved changes
                </span>
              ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !config}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
