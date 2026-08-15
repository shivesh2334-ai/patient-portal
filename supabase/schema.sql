-- Guideline-Based Longitudinal Patient Portal — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique not null,           -- de-identified research code, e.g. P-1234
  name text not null,                           -- clinic-facing only; excluded from research export
  age int not null,
  sex text not null check (sex in ('male','female','other')),
  height_cm numeric,
  weight_kg numeric,
  diabetes_duration_years numeric,
  hypertension_duration_years numeric,

  family_history_diabetes boolean default false,
  family_history_htn boolean default false,
  family_history_premature_ascvd boolean default false,
  smoking_status text default 'never' check (smoking_status in ('never','former','current')),
  alcohol_use text default 'none' check (alcohol_use in ('none','occasional','regular')),
  comorbidities text[] default '{}',
  medications text[] default '{}',
  ascvd_history boolean default false,

  created_at timestamptz default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  visit_date date not null,
  test_date date,
  clinician_notes text,
  follow_up_interval_weeks numeric,

  weight_kg numeric,
  bmi numeric,

  -- Diabetes
  fasting_glucose numeric,
  postprandial_glucose numeric,
  hba1c numeric,
  hypoglycaemia_episodes int default 0,

  -- Hypertension
  sbp numeric,
  dbp numeric,
  home_sbp numeric,
  home_dbp numeric,

  -- Lipids
  ldl_c numeric,
  hdl_c numeric,
  triglycerides numeric,
  non_hdl_c numeric,

  -- Kidney / complications
  creatinine numeric,
  egfr numeric,
  urine_albumin_creatinine_ratio numeric,
  neuropathy boolean default false,
  retinopathy boolean default false,

  -- Advice delivered
  advice_diet boolean default false,
  advice_exercise boolean default false,
  advice_med_class_suggested text,
  follow_up_urgency text default 'routine' check (follow_up_urgency in ('routine','early','urgent')),

  created_at timestamptz default now()
);

create index if not exists idx_visits_patient_id on visits(patient_id);
create index if not exists idx_visits_visit_date on visits(visit_date);

-- Row Level Security: enable and open for the anon key during development.
-- IMPORTANT: tighten these policies before storing real patient data —
-- restrict by authenticated clinician (auth.uid()) rather than "true".
alter table patients enable row level security;
alter table visits enable row level security;

create policy "dev_open_patients" on patients for all using (true) with check (true);
create policy "dev_open_visits" on visits for all using (true) with check (true);

-- Optional: a view that is safe to expose directly for research (excludes name)
create or replace view research_export as
select
  p.patient_code, p.age, p.sex, p.diabetes_duration_years, p.hypertension_duration_years,
  p.family_history_diabetes, p.family_history_htn, p.family_history_premature_ascvd,
  p.smoking_status, p.alcohol_use, p.ascvd_history,
  v.visit_date, v.hba1c, v.fasting_glucose, v.postprandial_glucose, v.hypoglycaemia_episodes,
  v.sbp, v.dbp, v.ldl_c, v.hdl_c, v.triglycerides, v.egfr, v.urine_albumin_creatinine_ratio,
  v.neuropathy, v.retinopathy, v.advice_diet, v.advice_exercise, v.advice_med_class_suggested,
  v.follow_up_urgency
from visits v
join patients p on p.id = v.patient_id;
