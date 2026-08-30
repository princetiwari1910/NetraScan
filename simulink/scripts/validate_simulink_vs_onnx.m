%% NetraScan: Cross-Platform Validation Script (Simulink / MATLAB vs. Python ONNX)
% Compares predictions, class probabilities, referability decisions, and quality metrics
% across the MATLAB/Simulink workflow and the live ONNX production runtime.

function validationReport = validate_simulink_vs_onnx()
    fprintf('=================================================================\n');
    fprintf('  NETRASCAN: CROSS-PLATFORM EQUIVALENCE VALIDATION\n');
    fprintf('  Comparing: Simulink / MATLAB Pipeline  vs.  Python ONNX Runtime\n');
    fprintf('=================================================================\n\n');

    currentScriptPath = fileparts(mfilename('fullpath'));
    projectRoot = fullfile(currentScriptPath, '..', '..');
    demoSamplesDir = fullfile(projectRoot, 'demo_samples');

    testCases = {
        'fundus_grade0_normal.jpg', 0, false, 0.9887, 416.70;
        'fundus_grade2_moderate.jpg', 0, false, 0.9578, 629.03;
        'fundus_blurry.jpg',          -1, false, 0.0000, 1.05
    };

    numCases = size(testCases, 1);
    reportRows = cell(numCases, 7);

    for k = 1:numCases
        imgFilename = testCases{k, 1};
        expectedGrade = testCases{k, 2};
        expectedReferable = testCases{k, 3};
        expectedConf = testCases{k, 4};
        expectedVar = testCases{k, 5};

        imgPath = fullfile(demoSamplesDir, imgFilename);
        fprintf('Testing Case #%d: %s\n', k, imgFilename);

        if ~exist(imgPath, 'file')
            fprintf('  ⚠️ File missing: %s\n', imgPath);
            continue;
        end

        % 1. Execute Simulink / MATLAB Simulation
        simRes = run_netrascan_sim(imgPath);

        % 2. Compare Outputs
        if expectedGrade == -1
            % Blurry image quality test
            gradeMatch = ~simRes.isQualityPass;
            statusText = ternary(gradeMatch, 'PASS (Correctly Rejected)', 'FAIL');
        else
            gradeMatch = (simRes.predictedGrade == expectedGrade);
            statusText = ternary(gradeMatch, 'PASS (Exact Match)', 'MISMATCH');
        end

        confDiff = abs(simRes.confidence - expectedConf);
        referableMatch = (simRes.isReferable == expectedReferable);

        fprintf('  - Expected Grade:   %d | Simulink Grade: %d [%s]\n', expectedGrade, simRes.predictedGrade, statusText);
        fprintf('  - Expected Conf:    %.2f%% | Simulink Conf:  %.2f%% (Δ = %.4f)\n', expectedConf*100, simRes.confidence*100, confDiff);
        fprintf('  - Expected Refer:   %s | Simulink Refer: %s\n', string(expectedReferable), string(simRes.isReferable));
        fprintf('  - Laplacian Var:    %.2f (Reference ONNX: %.2f)\n\n', simRes.laplacianVariance, expectedVar);

        reportRows{k, 1} = imgFilename;
        reportRows{k, 2} = expectedGrade;
        reportRows{k, 3} = simRes.predictedGrade;
        reportRows{k, 4} = expectedConf;
        reportRows{k, 5} = simRes.confidence;
        reportRows{k, 6} = simRes.isReferable;
        reportRows{k, 7} = statusText;
    end

    % 3. Summary Table
    fprintf('=================================================================\n');
    fprintf('  VALIDATION SUMMARY REPORT TABLE\n');
    fprintf('=================================================================\n');
    fprintf('%-30s | %-8s | %-8s | %-10s | %-10s | %-12s\n', ...
        'Image Filename', 'ExpGrade', 'SimGrade', 'ExpConf', 'SimConf', 'Validation');
    fprintf('-----------------------------------------------------------------\n');
    for k = 1:numCases
        fprintf('%-30s | %-8d | %-8d | %-9.2f%% | %-9.2f%% | %-12s\n', ...
            reportRows{k, 1}, reportRows{k, 2}, reportRows{k, 3}, ...
            reportRows{k, 4}*100, reportRows{k, 5}*100, reportRows{k, 7});
    end
    fprintf('=================================================================\n\n');

    validationReport = reportRows;
end

function val = ternary(cond, a, b)
    if cond, val = a; else, val = b; end
end
