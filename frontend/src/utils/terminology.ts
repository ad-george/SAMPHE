export type TerminologyMap = {
  faculty: string | null;
  department: string;
  program: string;
  year: string;
  timeUnit: string;
  unit: string;
  lecturer: string;
  student: string;
  hod: string;
};

const base: TerminologyMap = {
  faculty: "Faculty",
  department: "Department",
  program: "Program",
  year: "Year",
  timeUnit: "Semester",
  unit: "Unit",
  lecturer: "Lecturer",
  student: "Student",
  hod: "HOD",
};

export const terminology: Record<string, TerminologyMap> = {
  UNIVERSITY: { ...base },
  KMTC: { ...base },
  NATIONAL_POLYTECHNIC: {
    ...base,
    faculty: null,
    program: "Course",
    timeUnit: "Term",
    lecturer: "Trainer",
  },
  TTI: {
    ...base,
    faculty: null,
    program: "Course",
    timeUnit: "Term",
    lecturer: "Trainer",
  },
  TTC: {
    ...base,
    faculty: null,
    program: "Course",
    timeUnit: "Term",
    lecturer: "Trainer",
  },
};

export const getTerminology = (institutionType?: string): TerminologyMap => {
  const key = (institutionType || "UNIVERSITY").toUpperCase();
  return terminology[key] || terminology.UNIVERSITY;
};

// Pluralization helpers
export const pluralize = (word: string): string => {
  if (word.endsWith("y")) return word.slice(0, -1) + "ies";
  if (word.endsWith("s")) return word;
  return word + "s";
};