function result = NetraScan_Explainability(imagePath)

% NETRASCAN_EXPLAINABILITY
% Loads the trained NetraScan model, predicts one fundus image,
% calculates referable DR probability, and generates Grad-CAM.

    % ---------- Settings ----------
    finalThreshold = 0.35;
    featureLayer = 'res5b_relu';

    % ---------- Load trained model ----------
    load('netTransfer.mat', 'netTransfer');

    % ---------- Load image ----------
    img = imread(imagePath);

    % Convert grayscale to RGB
    if size(img, 3) == 1
        img = repmat(img, [1 1 3]);
    end

    % Get network input size
    inputSize = netTransfer.Layers(1).InputSize;

    % Resize image
    img = imresize(img, inputSize(1:2));

    % ---------- Prediction ----------
    tic;
    [predictedLabel, scores] = classify(netTransfer, img);
    inferenceTime = toc;

    % ---------- Class names ----------
    classNames = string(netTransfer.Layers(end).Classes);

    % Predicted confidence
    [confidence, ~] = max(scores);

    predictedGrade = string(predictedLabel);

    % ---------- Referable probability ----------
    % Grade 2, 3 and 4 = Referable DR
    referableMask = ismember(classNames, ["2","3","4"]);

    if ~any(referableMask)
        error('Could not find class labels 2, 3, 4 in the network.');
    end

    referableProb = sum(scores(referableMask));

    predictedReferable = referableProb >= finalThreshold;

    % ---------- Grad-CAM ----------
    scoreMap = gradCAM(netTransfer, img, predictedLabel, ...
        'FeatureLayer', featureLayer, ...
        'ReductionLayer', 'prob');

    % ---------- Create figure ----------
    fig = figure('Color', 'white');

    tiledlayout(1,2, ...
        'Padding', 'compact', ...
        'TileSpacing', 'compact');

    % Original image
    nexttile;
    imshow(img);
    title('Original Fundus Image');

    % Grad-CAM
    nexttile;
    imshow(img);
    hold on;

    imagesc(scoreMap, 'AlphaData', 0.50);

    colormap jet;
    colorbar;

    hold off;

    title("Grad-CAM - Predicted Grade " + predictedGrade);

    % ---------- Overall title ----------
    sgtitle(sprintf([ ...
        'NetraScan Explainability\n' ...
        'Predicted: Grade %s | Confidence: %.2f%% | ' ...
        'Referable probability: %.2f%% | Threshold: %.2f'], ...
        predictedGrade, ...
        confidence*100, ...
        referableProb*100, ...
        finalThreshold));

    % ---------- Save image ----------
    outputFile = "NetraScan_GradCAM_" + ...
        datestr(now, 'yyyymmdd_HHMMSS') + ".png";

    exportgraphics(fig, outputFile, 'Resolution', 150);

    % ---------- Close figure ----------
    close(fig);

    % ---------- Return result ----------
    result = struct();

    result.predictedGrade = predictedGrade;
    result.confidence = double(confidence);
    result.referableProbability = double(referableProb);
    result.referableThreshold = finalThreshold;
    result.predictedReferable = logical(predictedReferable);
    result.inferenceTimeSeconds = double(inferenceTime);
    result.gradCAMFeatureLayer = featureLayer;
    result.gradCAMFile = char(outputFile);
    result.classNames = classNames;
    result.classScores = double(scores);

    % ---------- Display result ----------
    fprintf('\n=== NETRASCAN RESULT ===\n');
    fprintf('Predicted Grade: %s\n', predictedGrade);
    fprintf('Confidence: %.2f%%\n', confidence*100);
    fprintf('Referable Probability: %.2f%%\n', referableProb*100);
    fprintf('Referable Threshold: %.2f\n', finalThreshold);
    fprintf('Referable DR: %s\n', string(predictedReferable));
    fprintf('Inference Time: %.4f seconds\n', inferenceTime);
    fprintf('Grad-CAM saved as: %s\n', outputFile);

end
