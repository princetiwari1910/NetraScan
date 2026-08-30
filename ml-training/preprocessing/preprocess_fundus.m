function outputImage = preprocess_fundus(inputImage)
%PREPROCESS_FUNDUS Preprocesses a retinal fundus image for NetraScan.
%
% Input:
%   inputImage - RGB retinal/fundus image
%
% Output:
%   outputImage - 224x224x3 uint8 image ready for model inference

% Validate input
if isempty(inputImage)
    error('Input image is empty.');
end

% Convert grayscale images to RGB
if size(inputImage, 3) == 1
    inputImage = repmat(inputImage, [1 1 3]);
end

% Ensure RGB image
if size(inputImage, 3) ~= 3
    error('Input image must have 1 or 3 channels.');
end

% Resize to ResNet-18 input size
outputImage = imresize(inputImage, [224 224]);

% Convert to uint8 if necessary
if ~isa(outputImage, 'uint8')
    outputImage = im2uint8(outputImage);
end

% Optional contrast enhancement
for channel = 1:3
    outputImage(:,:,channel) = adapthisteq( ...
        outputImage(:,:,channel), ...
        'ClipLimit', 0.01);
end
end

