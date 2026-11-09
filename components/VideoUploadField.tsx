"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import {
  MAX_VIDEO_MB,
  VideoItem,
  videoItemsFromFiles,
} from "@/lib/videoUpload";

interface VideoUploadFieldProps {
  videos: VideoItem[];
  onChange: (videos: VideoItem[]) => void;
}

// Admin field for adding, ordering and removing a boat's videos. Files are
// only uploaded when the boat form is submitted.
export function VideoUploadField({ videos, onChange }: VideoUploadFieldProps) {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;

    const tooBig = files.filter((f) => f.size > MAX_VIDEO_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      alert(
        `These videos are over ${MAX_VIDEO_MB} MB and were skipped:\n\n${tooBig
          .map((f) => `• ${f.name} (${Math.round(f.size / 1024 / 1024)} MB)`)
          .join("\n")}\n\nPlease export a smaller version (1080p MP4 works best).`
      );
    }
    const ok = files.filter((f) => f.size <= MAX_VIDEO_MB * 1024 * 1024);
    if (ok.length > 0) onChange([...videos, ...videoItemsFromFiles(ok)]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(videos);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(items);
  };

  const remove = (id: string) => onChange(videos.filter((v) => v.id !== id));

  return (
    <div className="space-y-2">
      <label
        htmlFor="videos"
        className="block text-sm font-medium text-gray-700"
      >
        Videos
      </label>
      <p className="text-xs text-gray-500">
        MP4 (H.264) plays everywhere. iPhone HEVC .mov files may not play in
        Chrome. Max {MAX_VIDEO_MB} MB each. Drag to reorder.
      </p>
      <input
        type="file"
        id="videos"
        onChange={handleFiles}
        multiple
        accept="video/mp4,video/quicktime,video/webm,video/*"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />

      {videos.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="droppable-videos" direction="vertical">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 mt-4"
              >
                {videos.map((video, index) => (
                  <Draggable
                    key={video.id}
                    draggableId={video.id}
                    index={index}
                  >
                    {(
                      p: DraggableProvided,
                      snapshot: DraggableStateSnapshot
                    ) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className={`flex items-center space-x-4 p-2 bg-white rounded-lg border ${
                          snapshot.isDragging
                            ? "border-blue-500 shadow-lg"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="relative w-40 h-24 flex-shrink-0 bg-black rounded-md overflow-hidden">
                          <video
                            src={`${video.url}#t=0.1`}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow flex items-center justify-between min-w-0 gap-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-700">
                              Video {index + 1} {video.isNew ? "(New)" : ""}
                            </span>
                            {video.file && (
                              <p className="text-xs text-gray-500 truncate">
                                {video.file.name} ·{" "}
                                {Math.round(video.file.size / 1024 / 1024)} MB
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(video.id)}
                            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
