import onnxruntime as ort
import numpy as np

model_path = "ml-training/models/NetraScan_ResNet18.onnx"
session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])

print("=== ONNX RUNTIME PROVIDER CHECK ===")
print(f"Active Providers: {session.get_providers()}")
print(f"Inputs: {[(i.name, i.shape, i.type) for i in session.get_inputs()]}")
print(f"Outputs: {[(o.name, o.shape, o.type) for o in session.get_outputs()]}")

dummy_input = np.random.uniform(0, 255, (1, 3, 224, 224)).astype(np.float32)
outputs = session.run(None, {'data': dummy_input})
print(f"Run successful! Output shape: {outputs[0].shape}, Sum of softmax: {np.sum(outputs[0]):.6f}")
print(f"Output probabilities: {outputs[0]}")

