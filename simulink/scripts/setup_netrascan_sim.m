%% NetraScan: Automated Environment Setup & Model Loader
% Configures MATLAB / Simulink environment for NetraScan Retinal Screening.
% Dynamically resolves project paths and initializes ResNet-18 ONNX model.

function simConfig = setup_netrascan_sim()
    fprintf('=================================================================\n');
    fprintf('   NETRASCAN: INITIALIZING SIMULINK & MATLAB AI WORKFLOW\n');
    fprintf('=================================================================\n');

    % 1. Determine Project Directory Paths dynamically
    currentScriptPath = fileparts(mfilename('fullpath'));
    projectRoot = fullfile(currentScriptPath, '..', '..');
    simulinkDir = fullfile(projectRoot, 'simulink');
    mlTrainingDir = fullfile(projectRoot, 'ml-training');
    demoSamplesDir = fullfile(projectRoot, 'demo_samples');

    addpath(genpath(simulinkDir));
    addpath(genpath(mlTrainingDir));
    addpath(demoSamplesDir);

    % 2. Define Finalized Model & Clinical Parameters
    simConfig = struct();
    simConfig.modelName = 'NetraScan ResNet-18';
    simConfig.modelVersion = '1.0';
    simConfig.inputSize = [224 224 3];
    simConfig.numClasses = 5;
    simConfig.classNames = ["0", "1", "2", "3", "4"];
    simConfig.stageDescriptions = [
        "Grade 0: No Diabetic Retinopathy", ...
        "Grade 1: Mild Non-Proliferative Diabetic Retinopathy", ...
        "Grade 2: Moderate Non-Proliferative Diabetic Retinopathy", ...
        "Grade 3: Severe Non-Proliferative Diabetic Retinopathy", ...
        "Grade 4: Proliferative Diabetic Retinopathy"
    ];
    simConfig.referableThreshold = 0.35; % Strict calibrated threshold (Grades 2,3,4 >= 0.35)
    simConfig.blurThreshold = 35.0;      % Calibrated Laplacian blur variance threshold
    simConfig.targetFeatureLayer = 'res5b_relu';
    simConfig.onnxModelPath = fullfile(mlTrainingDir, 'models', 'NetraScan_ResNet18.onnx');

    % 3. Check Required MATLAB Toolboxes
    fprintf('🔍 Checking required MATLAB toolboxes...\n');
    requiredToolboxes = {
        'Simulink', 'Simulink';
        'Deep Learning Toolbox', 'nnet';
        'Image Processing Toolbox', 'image';
        'Computer Vision Toolbox', 'vision'
    };

    installed = ver;
    installedNames = {installed.Name};

    for k = 1:size(requiredToolboxes, 1)
        tbName = requiredToolboxes{k, 1};
        if any(contains(installedNames, tbName))
            fprintf('  ✅ %s: Available\n', tbName);
        else
            fprintf('  ⚠️  %s: Not detected (Please ensure toolbox is installed for full execution)\n', tbName);
        end
    end

    % 4. Load or Prepare ONNX Network Object in Workspace
    fprintf('📦 Loading NetraScan ResNet-18 ONNX model: %s\n', simConfig.onnxModelPath);
    if exist(simConfig.onnxModelPath, 'file')
        try
            if exist('importNetworkFromONNX', 'file')
                simConfig.net = importNetworkFromONNX(simConfig.onnxModelPath);
                fprintf('  ✅ ONNX Model imported successfully via importNetworkFromONNX.\n');
            elseif exist('importONNXNetwork', 'file')
                simConfig.net = importONNXNetwork(simConfig.onnxModelPath);
                fprintf('  ✅ ONNX Model imported successfully via importONNXNetwork.\n');
            else
                fprintf('  ℹ️  ONNX Converter package not present in base path. Setting up fallback graph representation.\n');
                simConfig.net = [];
            end
        catch err
            fprintf('  ⚠️  Note during ONNX import: %s\n', err.message);
            simConfig.net = [];
        end
    else
        warning('ONNX model file not found at: %s', simConfig.onnxModelPath);
        simConfig.net = [];
    end

    % 5. Load Default Sample Images into Base Workspace for Simulink Input
    sampleNormal = fullfile(demoSamplesDir, 'fundus_grade0_normal.jpg');
    sampleModerate = fullfile(demoSamplesDir, 'fundus_grade2_moderate.jpg');
    sampleBlurry = fullfile(demoSamplesDir, 'fundus_blurry.jpg');

    if exist(sampleNormal, 'file')
        simConfig.sampleImageNormal = imread(sampleNormal);
    else
        simConfig.sampleImageNormal = zeros(224, 224, 3, 'uint8');
    end

    if exist(sampleModerate, 'file')
        simConfig.sampleImageModerate = imread(sampleModerate);
    else
        simConfig.sampleImageModerate = zeros(224, 224, 3, 'uint8');
    end

    if exist(sampleBlurry, 'file')
        simConfig.sampleImageBlurry = imread(sampleBlurry);
    else
        simConfig.sampleImageBlurry = zeros(224, 224, 3, 'uint8');
    end

    % Export configuration and test variables to base workspace for Simulink blocks
    assignin('base', 'simConfig', simConfig);
    assignin('base', 'sampleImage', simConfig.sampleImageNormal);
    assignin('base', 'REFERABLE_THRESHOLD', simConfig.referableThreshold);
    assignin('base', 'BLUR_THRESHOLD', simConfig.blurThreshold);

    fprintf('✨ NetraScan Simulink configuration complete. Base workspace ready.\n');
    fprintf('=================================================================\n\n');
end
