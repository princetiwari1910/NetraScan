%% NetraScan: District Tele-Ophthalmology Queue & Capacity Simulation
% Models patient screening flow at Primary Health Centers (PHCs) and
% referral queues at Tertiary Eye Hospitals.

clear; clc;

% Simulation Parameters
num_days = 30;
patients_per_day_phc = 80;
num_phcs = 5;
total_patients = num_days * patients_per_day_phc * num_phcs;

% AI Triage Breakdown (based on empirical DR prevalence)
% Grade 0 (Normal): 65%
% Grade 1 (Mild NPDR): 15%
% Grade 2 (Moderate NPDR): 12% -> Referable
% Grade 3 (Severe NPDR): 5%   -> Referable
% Grade 4 (PDR): 3%          -> Referable

referable_rate = 0.12 + 0.05 + 0.03; % 20% referable
non_referable_rate = 0.80;           % 80% treated/monitored locally

ai_triage_time_sec = 4.5;            % NetraScan inference + Grad-CAM latency
human_review_time_min = 12.0;        % Clinician review time for referable cases

referral_cases = total_patients * referable_rate;
routine_cases = total_patients * non_referable_rate;

% Specialist workload without AI screening (all patients referred)
workload_hours_traditional = (total_patients * human_review_time_min) / 60;

% Specialist workload with NetraScan AI triage (only referable patients seen)
workload_hours_netrascan = (referral_cases * human_review_time_min) / 60;

time_saved_hours = workload_hours_traditional - workload_hours_netrascan;
workload_reduction_pct = (time_saved_hours / workload_hours_traditional) * 100;

fprintf('====================================================\n');
fprintf('  NETRASCAN DISTRICT CAPACITY SIMULATION REPORT\n');
fprintf('====================================================\n');
fprintf('Total Patients Screened (30 Days, 5 PHCs): %d\n', total_patients);
fprintf('Routine Monitoring (Grade 0-1):             %d (%.1f%%)\n', routine_cases, non_referable_rate*100);
fprintf('Specialist Referrals (Grade 2-4):           %d (%.1f%%)\n', referral_cases, referable_rate*100);
fprintf('Traditional Specialist Workload:           %.1f hours\n', workload_hours_traditional);
fprintf('NetraScan-Assisted Specialist Workload:    %.1f hours\n', workload_hours_netrascan);
fprintf('Specialist Time Saved:                     %.1f hours (%.1f%% reduction)\n', time_saved_hours, workload_reduction_pct);
fprintf('====================================================\n');
