"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import CalendarView from "@/components/CalendarView";
import DayView from "@/components/DayView";
import AnalyticsView from "@/components/AnalyticsView";
import GeneratorView from "@/components/GeneratorView";
import { fetchRuns, fetchRunDetail, publishCandidate, updateSelection, updateEngagement } from "@/lib/api";
import type { RunSummary, RunDetail, View, Theme } from "@/lib/types";

export default function Home() {
  const [view, setView] = useState<View>("calendar");
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [today, setToday] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRuns = useCallback(() => {
    fetchRuns()
      .then(setRuns)
      .catch((e) => setErrorMsg(e instanceof Error ? e.message : "Could not load runs"));
  }, []);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((d) => setToday(d.date))
      .catch(() => {});
    loadRuns();
  }, [loadRuns]);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setView("day");
    setLoadingDetail(true);
    fetchRunDetail(date)
      .then(setRunDetail)
      .catch((e) => setErrorMsg(e instanceof Error ? e.message : "Could not load that day"))
      .finally(() => setLoadingDetail(false));
  };

  const handlePublish = async (candidateId: string) => {
    if (!selectedDate) return;
    try {
      await publishCandidate(selectedDate, candidateId);
      const detail = await fetchRunDetail(selectedDate);
      setRunDetail(detail);
      loadRuns();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not publish that draft");
    }
  };

  const handleEditSelection = async (date: string, patch: { topic?: string; theme?: Theme }) => {
    setRuns(
      (prev) =>
        prev?.map((r) =>
          r.date === date && r.postedSelection
            ? {
                ...r,
                postedSelection: {
                  ...r.postedSelection,
                  ...(patch.topic !== undefined ? { topic: patch.topic } : {}),
                  ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
                },
              }
            : r
        ) ?? prev
    );
    try {
      await updateSelection(date, patch);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not save that edit");
      loadRuns();
    }
  };

  const handleEditEngagement = async (
    date: string,
    patch: { impressions?: number; likes?: number; comments?: number }
  ) => {
    setRuns(
      (prev) =>
        prev?.map((r) =>
          r.date === date
            ? {
                ...r,
                engagement: {
                  impressions: r.engagement?.impressions ?? 0,
                  likes: r.engagement?.likes ?? 0,
                  comments: r.engagement?.comments ?? 0,
                  ...patch,
                },
              }
            : r
        ) ?? prev
    );
    try {
      await updateEngagement(date, patch);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not save that edit");
      loadRuns();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <Sidebar
        activeView={view}
        onSelect={(v) => {
          setView(v);
          if (v !== "day") setSelectedDate(null);
        }}
      />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          minWidth: 0,
        }}
      >
        {errorMsg && (
          <div
            style={{
              fontSize: 13,
              color: "var(--color-accent-300)",
              border: "1px solid var(--color-accent-600)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            {errorMsg}
          </div>
        )}

        {runs === null ? (
          <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>Loading…</div>
        ) : (
          <>
            {view === "dashboard" && (
              <DashboardView
                runs={runs}
                today={today}
                onEditSelection={handleEditSelection}
                onEditEngagement={handleEditEngagement}
              />
            )}
            {view === "calendar" && (
              <CalendarView runs={runs} today={today} selectedDate={selectedDate} onSelectDate={selectDate} />
            )}
            {view === "day" &&
              (loadingDetail || !runDetail ? (
                <div style={{ fontSize: 13, color: "var(--color-neutral-400)" }}>Loading…</div>
              ) : (
                <DayView run={runDetail} today={today} onBack={() => setView("calendar")} onPublish={handlePublish} />
              ))}
            {view === "analytics" && <AnalyticsView runs={runs} today={today} />}
            {view === "generator" && <GeneratorView />}
          </>
        )}
      </main>
    </div>
  );
}
