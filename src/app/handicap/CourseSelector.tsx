"use client";

import { useState, useMemo } from "react";
import { courses } from "@/data/courses";
import type { CourseData, TeeData } from "@/lib/handicap";

interface CourseSelectorProps {
  onSelect: (courseId: string, teeName: string, gender: "M" | "F") => void;
}

export default function CourseSelector({ onSelect }: CourseSelectorProps) {
  const courseList = useMemo(() => Object.values(courses), []);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<"M" | "F">("M");
  const [selectedTee, setSelectedTee] = useState<string | null>(null);

  const selectedCourse: CourseData | null = selectedCourseId
    ? courses[selectedCourseId] ?? null
    : null;

  const hasGenderSpecificTees =
    selectedCourse?.tees.some((t) => t.gender === "F") ?? false;

  const availableTees: TeeData[] = useMemo(() => {
    if (!selectedCourse) return [];
    return selectedCourse.tees.filter(
      (t) => t.gender === selectedGender || t.gender === "Mixed",
    );
  }, [selectedCourse, selectedGender]);

  function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedTee(null);
    // Reset gender to M when switching courses
    setSelectedGender("M");
  }

  function handleGenderChange(gender: "M" | "F") {
    setSelectedGender(gender);
    setSelectedTee(null);
  }

  function handleTeeSelect(tee: TeeData) {
    setSelectedTee(tee.name);
    onSelect(selectedCourseId!, tee.name, selectedGender);
  }

  return (
    <div className="space-y-6">
      {/* Course selection */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Select Course
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {courseList.map((course) => {
            const isSelected = selectedCourseId === course.id;
            const isProvisional = course.tees.some((t) => t.ratingProvisional);
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => handleCourseSelect(course.id)}
                className={`relative rounded-lg border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-accent text-secondary"
                    : "border-border bg-surface-elevated text-text-secondary hover:border-primary/40"
                }`}
              >
                <span className="block text-base font-semibold">
                  {course.name}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {course.physicalHoles} holes &middot; Par {course.par} &middot;{" "}
                  {course.location}
                </span>
                {isProvisional && (
                  <span className="mt-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-amber-800">
                    Provisional ratings
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gender selector (only when course has gender-specific tees) */}
      {selectedCourse && hasGenderSpecificTees && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Rating Set
          </h3>
          <div className="flex gap-2">
            {(["M", "F"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenderChange(g)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedGender === g
                    ? "border-primary bg-accent text-secondary"
                    : "border-border text-text-secondary hover:border-primary/40"
                }`}
              >
                {g === "M" ? "Men" : "Women"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tee selection */}
      {selectedCourse && availableTees.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Select Tee
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableTees.map((tee) => {
              const isSelected = selectedTee === tee.name;
              // Determine text color for contrast on the tee-color dot
              const needsDarkText =
                tee.color === "#FFFFFF" || tee.color === "#C5A028";
              return (
                <button
                  key={`${tee.name}-${tee.gender}`}
                  type="button"
                  onClick={() => handleTeeSelect(tee)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-accent text-secondary"
                      : "border-border bg-surface-elevated text-text-secondary hover:border-primary/40"
                  }`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: tee.color }}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col items-start">
                    <span
                      className={`text-sm font-semibold ${needsDarkText ? "" : ""}`}
                    >
                      {tee.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {tee.totalDistance}m &middot; CR {tee.courseRating} / SR{" "}
                      {tee.slopeRating}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
