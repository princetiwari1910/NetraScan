%% NetraScan: District Tele-Ophthalmology Queue & Capacity Simulation
% Models patient screening flow at Primary Health Centers (PHCs) and
% referral queues at Tertiary Eye Hospitals.

function simReport = patient_queue_sim()
    fprintf('=================================================================\n');
    fprintf('  NETRASCAN: DISTRICT TELE-OPHTHALMOLOGY QUEUE SIMULATION\n');
    fprintf('=================================================================\n');

    % 1. Multi-PHC Network Simulation Parameters
    num_days = 30;
    patients_per_day_phc = 80;
    phc_list = ["PHC Pune", "PHC Mumbai", "PHC Delhi", "PHC Hyderabad", "PHC Nagpur"];
    num_phcs = length(phc_list);
    total_patients = num_days * patients_per_day_phc * num_phcs;

    % 2. AI Triage Breakdown (Based on ICDR Empirical Prevalence)
    % Grade 0 (Normal): 65%
    % Grade 1 (Mild NPDR): 15%
    % Grade 2 (Moderate NPDR): 12% -> Referable
    % Grade 3 (Severe NPDR): 5%   -> Referable
    % Grade 4 (PDR): 3%          -> Referable
    dist_grade0 = 0.65;
    dist_grade1 = 0.15;
    dist_grade2 = 0.12;
    dist_grade3 = 0.05;
    dist_grade4 = 0.03;

    referable_rate = dist_grade2 + dist_grade3 + dist_grade4; % 20% referable
    non_referable_rate = dist_grade0 + dist_grade1;           % 80% routine monitoring

    ai_inference_time_sec = 0.42;        % Documented MATLAB inference benchmark (server: ~0.02s)
    image_transmission_sec = 1.20;       % 4G/Broadband PHC image uplink
    total_ai_triage_sec = ai_inference_time_sec + image_transmission_sec;
    human_review_time_min = 12.0;        % Ophthalmologist comprehensive dilated review

    referral_cases = round(total_patients * referable_rate);
    routine_cases = round(total_patients * non_referable_rate);

    % 3. Capacity & Workload Calculations
    workload_hours_traditional = (total_patients * human_review_time_min) / 60;
    workload_hours_netrascan = (referral_cases * human_review_time_min) / 60;
    time_saved_hours = workload_hours_traditional - workload_hours_netrascan;
    workload_reduction_pct = (time_saved_hours / workload_hours_traditional) * 100;

    patients_screened_per_hour_phc = 3600 / (total_ai_triage_sec + 60); % ~1 patient/min
    daily_ai_compute_time_hours = (total_patients * ai_inference_time_sec) / 3600;

    % 4. Print Structured Report
    fprintf('Total PHC Fleet Size:                      %d centres (%s)\n', num_phcs, strjoin(phc_list, ', '));
    fprintf('Simulation Duration:                       %d days\n', num_days);
    fprintf('Total Screenings Evaluated:                %d patients\n', total_patients);
    fprintf('Routine Local Monitoring (Grade 0-1):      %d (%.1f%%)\n', routine_cases, non_referable_rate*100);
    fprintf('Specialist Referrals Triggered (Grade 2-4): %d (%.1f%%)\n', referral_cases, referable_rate*100);
    fprintf('Average AI Triage Latency (incl. uplink):  %.2f seconds/patient\n', total_ai_triage_sec);
    fprintf('Traditional Specialist Workload:           %.1f hours\n', workload_hours_traditional);
    fprintf('NetraScan-Assisted Specialist Workload:    %.1f hours\n', workload_hours_netrascan);
    fprintf('Ophthalmologist Time Saved:                %.1f hours (%.1f%% workload reduction)\n', time_saved_hours, workload_reduction_pct);
    fprintf('=================================================================\n\n');

    % 5. Return Structured Results Struct
    simReport = struct();
    simReport.numPHCs = num_phcs;
    simReport.numDays = num_days;
    simReport.totalPatients = total_patients;
    simReport.routineCases = routine_cases;
    simReport.referralCases = referral_cases;
    simReport.traditionalHours = workload_hours_traditional;
    simReport.netrascanHours = workload_hours_netrascan;
    simReport.timeSavedHours = time_saved_hours;
    simReport.workloadReductionPct = workload_reduction_pct;
end
