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

      // Order lists default to the current full category lists so the admin
      // can immediately drag to reorder.
      const mergeOrder = (saved: string[], all: Boat[]): string[] => {
        const existing = saved.filter((id) => all.some((b) => b.id === id));
        const missing = all
          .filter((b) => !existing.includes(b.id))
          .map((b) => b.id);
        return [...existing, ...missing];
      };
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
    setConfig({
      ...config,
      featured: { ...config.featured, [featuredKey]: next },
    });
  };

  const onFeaturedDragEnd = (result: DropResult) => {
    if (!config || !result.destination) return;
    const items = Array.from(config.featured[featuredKey]);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setConfig({
      ...config,
      featured: { ...config.featured, [featuredKey]: items },
    });
  };

  // --- Order tab helpers (reorder all) ---
  const orderKey: "new" | "preOwned" =
    activeTab === "orderNew" ? "new" : "preOwned";
  const orderList = config ? config.order[orderKey] : [];

  const onOrderDragEnd = (result: DropResult) => {
    if (!config || !result.destination) return;
    const items = Array.from(config.order[orderKey]);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setConfig({
      ...config,
      order: { ...config.order, [orderKey]: items },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[88vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Homepage & Page Ordering
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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

        <div className="p-6 overflow-y-auto flex-grow">
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
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Drag to set the order yachts appear on the{" "}
                <strong>
                  {orderKey === "new" ? "New Yachts" : "Pre-owned"}
                </strong>{" "}
                page. (Sold and basic listings still follow site display rules.)
              </p>
              <DragDropContext onDragEnd={onOrderDragEnd}>
                <Droppable droppableId="page-order">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 max-w-2xl"
                    >
                      {orderList.map((id, index) => {
                        const boat = boatById(id);
                        if (!boat) return null;
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
                                className={`flex items-center space-x-3 p-2 bg-white rounded-lg border cursor-move ${
                                  snap.isDragging
                                    ? "border-blue-500 shadow-lg"
                                    : "border-gray-200"
                                }`}
                              >
                                <div className="text-sm font-bold text-gray-500 min-w-[24px]">
                                  {index + 1}
                                </div>
                                <div className="relative w-12 h-12 flex-shrink-0">
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

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">{saveMessage}</div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
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
